import { useEffect, useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { NORMALIZED_ADDRESSES } from '../wagmi'

interface Policy {
  id: number
  policyAddress: string
  coverage: number
  premium: number
  policyholder: string
  payoutTriggered: boolean
  createdAt: string
}

interface FloodData {
  location: string
  level: number
  timestamp: string
  dataSource?: string
  station?: string
  stationId?: string
  usgsLink?: string
  updateFrequency?: string
  unit?: string
}

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  const navigate = useNavigate()

  // Admin wallet address
  const ADMIN_ADDRESS = '0xa3f3599f3B375F95125c4d9402140c075F733D8e'
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [floodData, setFloodData] = useState<FloodData | null>(null)
  const [loading, setLoading] = useState(true)
  const [criticalThreshold, setCriticalThreshold] = useState(() => {
    const stored = localStorage.getItem('criticalThreshold')
    return stored ? Number(stored) : 1500
  })
  const [warningThreshold, setWarningThreshold] = useState(() => {
    const stored = localStorage.getItem('warningThreshold')
    return stored ? Number(stored) : 1200
  })
  const [showThresholdEditor, setShowThresholdEditor] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [claimsPoolStatus, setClaimsPoolStatus] = useState({ totalCapacity: '0', availableBalance: '0', totalClaimsProcessed: '0' })
  const [claimingPolicyId, setClaimingPolicyId] = useState<number | null>(null)
  const [isUpdatingThreshold, setIsUpdatingThreshold] = useState(false)

  // Wagmi hooks for contract interaction
  const { writeContract, data: claimTxHash, error: claimError, isPending: isClaimPending } = useWriteContract()
  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({ 
    hash: claimTxHash 
  })

  // ABI for InsurancePool contract fundPolicy function (used for direct payouts)
  const poolAbi = [
    {
      inputs: [
        { internalType: 'address payable', name: 'policyAddress', type: 'address' },
        { internalType: 'uint256', name: 'coverageAmountWei', type: 'uint256' }
      ],
      name: 'fundPolicy',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ]

  // ABI for GovernanceContract floodThreshold
  const governanceAbi = [
    {
      inputs: [],
      name: 'floodThreshold',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'uint256', name: 'newThreshold', type: 'uint256' }],
      name: 'updateFloodThreshold',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ]

  // Fetch flood threshold from governance contract
  const { data: contractThreshold } = useReadContract({
    address: NORMALIZED_ADDRESSES.GOVERNANCE,
    abi: governanceAbi,
    functionName: 'floodThreshold',
  })

  // Use contract threshold if available, otherwise use frontend threshold
  const effectiveThreshold = contractThreshold ? Number(contractThreshold as bigint) : criticalThreshold

  // Persist thresholds to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('criticalThreshold', criticalThreshold.toString())
  }, [criticalThreshold])

  useEffect(() => {
    localStorage.setItem('warningThreshold', warningThreshold.toString())
  }, [warningThreshold])

  useEffect(() => {
    if (!isConnected) {
      navigate('/connect')
      return
    }
    fetchData()
    const interval = setInterval(fetchData, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [isConnected, navigate])

  const backendUrl = import.meta.env.VITE_BACKEND_URL

  const fetchData = async () => {
    try {
      const [policiesRes, floodRes, poolRes] = await Promise.all([
        axios.get(`${backendUrl}/api/v1/policies`),
        axios.get(`${backendUrl}/api/v1/oracle/flood-level/1`),
        axios.get(`${backendUrl}/api/v1/claims/pool/status`),
      ])

      // Handle policies response - backend returns { success: true, policies: [...] }
      const allPolicies = policiesRes.data.success ? policiesRes.data.policies : policiesRes.data;
      
      // Filter policies to only show those belonging to the connected wallet
      const userPolicies = allPolicies.filter((policy: Policy) =>
        policy.policyholder.toLowerCase() === address?.toLowerCase()
      )
      setPolicies(userPolicies)
      setFloodData(floodRes.data)
      
      // Handle pool status response
      const poolData = poolRes.data.data || poolRes.data;
      const attoToHbar = (atto: string) => {
        const attoBigInt = BigInt(atto || '0');
        const isNegative = attoBigInt < 0n;
        const absValue = isNegative ? -attoBigInt : attoBigInt;
        const hbarBigInt = absValue / BigInt(1e18);
        const remainder = absValue % BigInt(1e18);
        const decimal = Number(remainder) / 1e18;
        const result = Number(hbarBigInt) + decimal;
        return (isNegative ? -result : result).toFixed(2);
      };
      
      setClaimsPoolStatus({
        totalCapacity: attoToHbar(poolData.onChainBalance || poolData.totalPremiums || '0'),
        availableBalance: attoToHbar(poolData.poolBalance || '0'),
        totalClaimsProcessed: attoToHbar(poolData.totalPaid || '0')
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClaimPayout = async (policy: Policy) => {
    // Check if already claimed
    if (policy.payoutTriggered) {
      console.warn('Policy already claimed:', policy.id)
      alert(' This policy has already been claimed!')
      return
    }

    try {
      setClaimingPolicyId(policy.id)
      
      const poolAddress = import.meta.env.VITE_POOL_ADDRESS as `0x${string}`
      const coverageWei = BigInt(policy.coverage) * BigInt(1e18)
      
      console.log('💰 DIRECT POOL PAYOUT - Triggering blockchain payout:', {
        policyId: policy.id,
        policyholder: policy.policyholder,
        poolAddress,
        coverage: policy.coverage,
        coverageWei: coverageWei.toString(),
        floodLevel,
        effectiveThreshold,
        mechanism: 'DIRECT - Pool pays policyholder (no intermediate policy contract funding)'
      })
      
      // Call pool.fundPolicy() but send DIRECTLY to the policyholder address
      // This bypasses the policy contract entirely - funds go straight from pool to user
      writeContract({
        address: poolAddress,
        abi: poolAbi,
        functionName: 'fundPolicy',
        args: [policy.policyholder as `0x${string}`, coverageWei],
      })
      
      console.log('✅ Direct payout transaction initiated from InsurancePool → Policyholder')
      console.log('   No policy contract funding needed - pool is the source of funds!')
      // The transaction will be handled by the useWaitForTransactionReceipt hook
      // which will update isClaimSuccess when confirmed
    } catch (error: any) {
      console.error(' Error initiating claim transaction:', error);
      alert(` Failed to initiate claim: ${error.message || 'Unknown error'}`)
      setClaimingPolicyId(null)
    }
  }

  // Watch for successful claim transaction
  useEffect(() => {
    if (isClaimSuccess && claimingPolicyId) {
      console.log(' Claim transaction confirmed on blockchain:', claimTxHash);
      
      // Record the claim in the backend after blockchain confirmation
      const recordClaim = async (retryCount = 0) => {
        try {
          const policy = policies.find(p => p.id === claimingPolicyId)
          if (!policy) {
            console.error('Policy not found for claim recording:', claimingPolicyId)
            return
          }
          
          console.log('Recording claim in backend:', {
            policyId: policy.id,
            policyAddress: policy.policyAddress,
            policyholder: policy.policyholder,
            amount: policy.coverage,
            txHash: claimTxHash,
            floodLevel,
            attempt: retryCount + 1,
          })
          
          const response = await axios.post(`${backendUrl}/api/v1/claims/create`, {
            policyAddress: policy.policyAddress,
            amount: policy.coverage,
            txHash: claimTxHash,
            floodLevel,
          })
          
          console.log(' Claim recorded in backend:', response.data);
          alert(` Claim successful!\n\nTransaction Hash: ${String(claimTxHash)}\nClaim ID: ${String(response.data.id)}\n\nPayout has been sent to your wallet!`)
          
          setSelectedPolicy(null)
          setClaimingPolicyId(null)
          fetchData() // Refresh to show updated status
        } catch (error: any) {
          const errorData = error.response?.data || {};
          const errorMessage = errorData.message || error.message || 'Unknown error';
          const requestId = errorData.requestId || 'unknown';
          
          console.error(' Error recording claim in backend:', {
            status: error.response?.status,
            data: errorData,
            message: errorMessage,
            retryCount,
          });

          // Check if this is a retryable error (transient database issue)
          const isRetryable = 
            error.response?.status === 500 && 
            retryCount < 2 &&
            (errorMessage.includes('connection') || 
             errorMessage.includes('timeout') ||
             errorMessage.includes('persistence'));

          if (isRetryable) {
            console.log(` Transient error detected, retrying in 2 seconds (attempt ${retryCount + 2}/3)...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return recordClaim(retryCount + 1);
          }

          // Handle different error scenarios
          if (error.response?.status === 400) {
            // Business logic error (already claimed, etc.)
            alert(` ${errorData.error || errorMessage}\n\n${errorData.hint || ''}\n\nTransaction Hash: ${claimTxHash}`);
          } else if (error.response?.status === 402) {
            // Insufficient funds
            alert(` Insufficient funds in claims pool\n\nRequested: ${errorData.requested}\nAvailable: ${errorData.available}\n\nTransaction Hash: ${claimTxHash}\n\nPlease contact support.`);
          } else {
            // Generic persistence or server error
            alert(` Blockchain transaction succeeded but database operation failed.\n\nTransaction Hash: ${claimTxHash}\nRequest ID: ${requestId}\n\nError: ${errorMessage}\n\nPlease contact support with the Request ID.\n\nYour funds are safe on the blockchain.`);
          }
          
          setClaimingPolicyId(null)
        }
      }
      
      recordClaim()
    }
  }, [isClaimSuccess, claimingPolicyId, claimTxHash])

  // Watch for claim transaction errors
  useEffect(() => {
    if (claimError) {
      console.error('Claim transaction error:', claimError);
      alert(` Transaction failed: ${claimError.message}`)
      setClaimingPolicyId(null)
    }
  }, [claimError])

  // Function to update threshold on blockchain
  const handleUpdateThreshold = async (newThreshold: number) => {
    try {
      setIsUpdatingThreshold(true)
      console.log('Updating blockchain threshold to:', newThreshold)
      
      // Call updateFloodThreshold on governance contract
      writeContract({
        address: NORMALIZED_ADDRESSES.GOVERNANCE,
        abi: governanceAbi,
        functionName: 'updateFloodThreshold',
        args: [BigInt(newThreshold)],
      })
      
      // Wait for confirmation - handled by useWaitForTransactionReceipt
      alert(` Threshold update transaction sent! Please confirm in MetaMask.`)
    } catch (error: any) {
      console.error('Error updating threshold:', error)
      alert(` Failed to update threshold: ${error.message}`)
      setIsUpdatingThreshold(false)
    }
  }

  // Watch for threshold update success
  useEffect(() => {
    if (isClaimSuccess && isUpdatingThreshold) {
      alert(` Threshold updated successfully on blockchain!`)
      setIsUpdatingThreshold(false)
      // Refresh to show new threshold
      window.location.reload()
    }
  }, [isClaimSuccess, isUpdatingThreshold])

  if (!isConnected) return null

  const floodLevel = floodData?.level ?? null
  // Use contract threshold for validation (the source of truth)
  // But still show frontend thresholds in the UI for reference
  const floodPercentage = floodLevel ? Math.min((floodLevel / criticalThreshold) * 100, 100) : 0
  const isRisky = floodLevel && effectiveThreshold ? floodLevel > effectiveThreshold : false
  const isCritical = floodLevel ? floodLevel > criticalThreshold : false

  const getDataSourceInfo = () => {
    return {
      source: floodData?.dataSource || 'Loading...',
      station: floodData?.station || 'Loading...',
      stationId: floodData?.stationId || '',
      usgsLink: (floodData as any)?.usgsLink || '',
      updateFrequency: floodData?.updateFrequency || 'Real-time',
      unit: floodData?.unit || 'units',
      lastUpdate: floodData?.timestamp ? new Date(floodData.timestamp).toLocaleString() : 'Loading...'
    }
  }

  const dataSource = getDataSourceInfo()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {address?.slice(0, 6)}...{address?.slice(-4)}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/funding')}
              className="py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
              title="Admin: Fund underfunded policies"
            >
              🔧 Admin Funding
            </button>
            <button
              onClick={() => navigate('/buy-insurance')}
              className="py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              + New Insurance
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Enterprise Flood Level Monitor */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">Flood Level Monitor</h2>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Real-time</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                <div>
                  <p className="text-gray-500">Data Source</p>
                  <p className="text-gray-900 font-medium">{dataSource.source}</p>
                </div>
                <div>
                  <p className="text-gray-500">Monitoring Station</p>
                  <p className="text-gray-900 font-medium">{dataSource.station}</p>
                </div>
                <div>
                  <p className="text-gray-500">Station ID</p>
                  <a 
                    href={dataSource.usgsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium underline"
                  >
                    {dataSource.stationId} →
                  </a>
                </div>
                <div>
                  <p className="text-gray-500">Update Frequency</p>
                  <p className="text-gray-900 font-medium">{dataSource.updateFrequency}</p>
                </div>
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="text-gray-900 font-medium">{dataSource.lastUpdate}</p>
                </div>
                <div>
                  <p className="text-gray-500">Measurement Unit</p>
                  <p className="text-gray-900 font-medium">{dataSource.unit}</p>
                </div>
                <div>
                  <p className="text-gray-500">Smart Contract Threshold</p>
                  <p className="text-gray-900 font-medium">
                    {contractThreshold ? String(contractThreshold as bigint) : 'Loading...'} {dataSource.unit}
                  </p>
                </div>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
              isCritical ? 'bg-red-100 text-red-800' : 
              isRisky ? 'bg-orange-100 text-orange-800' : 
              'bg-green-100 text-green-800'
            }`}>
              {isCritical ? ' CRITICAL' : isRisky ? ' WARNING' : ' SAFE'}
            </div>
          </div>

          {/* Current Reading */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Water Level</p>
                <p className="text-5xl font-bold text-gray-900">
                  {floodLevel ?? '---'}
                  <span className="text-2xl text-gray-600 ml-2">({dataSource.unit})</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Severity Index</p>
                <p className="text-2xl font-bold text-gray-900">{floodPercentage.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Threshold Configuration - Admin Only */}
          {isAdmin ? (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">Risk Thresholds (Admin Only)</h3>
                <button
                  onClick={() => setShowThresholdEditor(!showThresholdEditor)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showThresholdEditor ? ' Done' : ' Configure'}
                </button>
              </div>

              {showThresholdEditor && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Warning Threshold ({dataSource.unit})</label>
                    <input
                      type="number"
                      value={warningThreshold}
                      onChange={(e) => setWarningThreshold(Number(e.target.value))}
                      className="w-32 px-3 py-1 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Smart Contract Threshold ({dataSource.unit})</label>
                    <input
                      type="number"
                      value={criticalThreshold}
                      onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                      className="w-32 px-3 py-1 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <button
                      onClick={() => handleUpdateThreshold(criticalThreshold)}
                      disabled={isUpdatingThreshold || isClaimPending}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        isUpdatingThreshold || isClaimPending
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isUpdatingThreshold ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating Blockchain...
                        </span>
                      ) : (
                        ' Save Threshold to Blockchain'
                      )}
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      This will update the smart contract threshold using admin privileges.
                    </p>
                  </div>
                </div>
              )}

              <div className="w-full bg-gray-200 rounded-full h-6 relative">
                <div
                  className={`h-6 rounded-full transition-all duration-300 ${
                    isCritical ? 'bg-red-600' : isRisky ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${floodPercentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>0</span>
                <span className="text-orange-600 font-medium"> {warningThreshold} ({(warningThreshold/100).toFixed(1)}m)</span>
                <span className="text-red-600 font-medium"> {criticalThreshold} ({(criticalThreshold/100).toFixed(1)}m)</span>
              </div>
            </div>
          ) : null}

          {/* Status Indicators */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-600 mb-1">Safe Range</p>
              <p className="text-lg font-bold text-green-600">0 - {warningThreshold}</p>
              <p className="text-xs text-gray-500 mt-1">0 - {(warningThreshold/100).toFixed(1)} meters</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-600 mb-1">Warning Range</p>
              <p className="text-lg font-bold text-orange-600">{warningThreshold} - {criticalThreshold}</p>
              <p className="text-xs text-gray-500 mt-1">{(warningThreshold/100).toFixed(1)} - {(criticalThreshold/100).toFixed(1)} meters</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-600 mb-1">Critical Range</p>
              <p className="text-lg font-bold text-red-600">{criticalThreshold}+</p>
              <p className="text-xs text-gray-500 mt-1">{(criticalThreshold/100).toFixed(1)}+ meters</p>
            </div>
          </div>

          {/* Contract Threshold Info */}
          {contractThreshold ? (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl"></span>
                <div className="flex-1">
                  <p className="font-semibold text-blue-900 mb-1">Smart Contract Threshold</p>
                  <p className="text-sm text-blue-800">
                    Claims can only be processed when flood level exceeds <strong>{String(contractThreshold as bigint)}</strong> {dataSource.unit}.
                    {floodLevel && floodLevel > Number(contractThreshold as bigint) ? (
                      <span className="text-green-700 font-medium">  Currently eligible for claims!</span>
                    ) : (
                      <span className="text-gray-600"> Current level: {floodLevel || '...'}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Alert Messages */}
          {(isRisky || isCritical) && (
            <div className={`p-4 rounded-lg ${
              isCritical ? 'bg-red-50 border-2 border-red-300' : 'bg-orange-50 border-2 border-orange-300'
            }`}>
              <div className="flex gap-3">
                <span className="text-2xl">{isCritical ? '' : ''}</span>
                <div className="flex-1">
                  <p className={`font-bold mb-1 ${
                    isCritical ? 'text-red-800' : 'text-orange-800'
                  }`}>
                    {isCritical ? 'CRITICAL ALERT: Automatic Payouts Active' : 'WARNING: Elevated Flood Risk'}
                  </p>
                  <p className={`text-sm ${
                    isCritical ? 'text-red-700' : 'text-orange-700'
                  }`}>
                    {isCritical 
                      ? `Water levels have exceeded the critical threshold by ${(floodLevel! - criticalThreshold)} cm. Smart contracts are automatically processing claims.`
                      : `Water levels are ${(floodLevel! - warningThreshold)} cm above warning threshold. Continue monitoring closely.`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isRisky && !isCritical && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex gap-3">
                <span className="text-2xl"></span>
                <div className="flex-1">
                  <p className="font-bold text-green-800 mb-1">System Status: Normal</p>
                  <p className="text-sm text-green-700">
                    All water levels are within safe parameters. Monitoring continues at {dataSource.updateFrequency} intervals.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Claims Pool Status - Admin Only */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl shadow-lg p-8 border border-purple-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Claims Pool Status (Admin Only)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Pool Capacity</p>
                <p className="text-2xl font-bold text-gray-900">{claimsPoolStatus.totalCapacity} HBAR</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Available for Claims</p>
                <p className="text-2xl font-bold text-green-600">{claimsPoolStatus.availableBalance} HBAR</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Number(claimsPoolStatus.totalCapacity) > 0 ? (Number(claimsPoolStatus.availableBalance) / Number(claimsPoolStatus.totalCapacity)) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Claims Processed</p>
                <p className="text-2xl font-bold text-orange-600">{claimsPoolStatus.totalClaimsProcessed} HBAR</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">This separate pool funds automatic claim payouts. Your premiums are kept separate.</p>
          </div>
        )}

        {/* Policies Grid */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Policies</h2>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : policies.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 mb-4">No policies found. Start by creating your first insurance policy!</p>
              <button
                onClick={() => navigate('/buy-insurance')}
                className="inline-block py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
              >
                Buy Insurance Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {policies.map((policy) => (
                <div 
                  key={policy.id} 
                  onClick={() => setSelectedPolicy(policy)}
                  className="border-2 border-gray-200 hover:border-blue-400 rounded-lg p-6 transition-all cursor-pointer hover:shadow-lg"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Policy #{policy.id}</p>
                      <p className="font-mono text-xs text-gray-500 mt-1">{policy.policyAddress.slice(0, 12)}...{policy.policyAddress.slice(-8)}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      policy.payoutTriggered ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {policy.payoutTriggered ? ' Payout Sent' : 'Active'}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Coverage:</span>
                      <span className="font-bold text-gray-900">{policy.coverage} HBAR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Premium Paid:</span>
                      <span className="font-bold text-gray-900">{policy.premium} HBAR</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-semibold text-gray-900">
                        {policy.payoutTriggered ? ' Claimed' : ' Protected'}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPolicy(policy);
                      }}
                      className="w-full mt-3 py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-lg transition-colors text-sm"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isAdmin && (
            <button
              onClick={() => navigate('/analytics')}
              className="bg-gradient-to-br from-purple-500 to-indigo-600 hover:shadow-xl rounded-lg p-6 transition-all text-left transform hover:scale-105"
            >
              <p className="text-2xl mb-2">📊</p>
              <p className="font-bold text-white">Analytics</p>
              <p className="text-sm text-purple-100">System metrics & insights</p>
            </button>
          )}
          <button
            onClick={() => navigate('/claims')}
            className="bg-white hover:shadow-lg rounded-lg p-6 transition-shadow text-left"
          >
            <p className="text-2xl mb-2">📋</p>
            <p className="font-bold text-gray-900">Claims</p>
            <p className="text-sm text-gray-600">View your claims</p>
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate('/pool')}
              className="bg-white hover:shadow-lg rounded-lg p-6 transition-shadow text-left"
            >
              <p className="text-2xl mb-2"></p>
              <p className="font-bold text-gray-900">Pool</p>
              <p className="text-sm text-gray-600">Liquidity & Reserve</p>
            </button>
          )}
          <button
            onClick={() => navigate('/connect')}
            className="bg-white hover:shadow-lg rounded-lg p-6 transition-shadow text-left"
          >
            <p className="text-2xl mb-2">🔌</p>
            <p className="font-bold text-gray-900">Wallet</p>
            <p className="text-sm text-gray-600">Manage connection</p>
          </button>
        </div>
      </div>

      {/* Policy Details Modal */}
      {selectedPolicy && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedPolicy(null)}
        >
          <div 
            className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Policy Details</h2>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-b pb-4">
                <label className="text-sm text-gray-600 block mb-1">Policy Address</label>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <code className="text-sm font-mono break-all">{selectedPolicy.policyAddress}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedPolicy.policyAddress)
                    }}
                    className="ml-2 text-blue-600 hover:text-blue-800 flex-shrink-0"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Policy ID</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedPolicy.id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Payout Status</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    selectedPolicy.payoutTriggered
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {selectedPolicy.payoutTriggered ? 'PAYOUT TRIGGERED' : 'ACTIVE'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Coverage</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedPolicy.coverage} HBAR</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Premium Paid</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedPolicy.premium} HBAR</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">Policy Holder</label>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <code className="text-sm font-mono break-all">{selectedPolicy.policyholder}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedPolicy.policyholder)
                    }}
                    className="ml-2 text-blue-600 hover:text-blue-800 flex-shrink-0"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">Created</label>
                <p className="text-gray-900">
                  {new Date(selectedPolicy.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div className="pt-4 border-t space-y-3">
                {selectedPolicy.payoutTriggered ? (
                  <div className="w-full px-6 py-3 bg-green-50 border-2 border-green-500 text-green-800 font-medium rounded-lg text-center">
                     Claim Already Processed
                  </div>
                ) : (
                  <button
                    onClick={() => handleClaimPayout(selectedPolicy)}
                    disabled={!isRisky || isClaimPending || isClaimConfirming || claimingPolicyId === selectedPolicy.id}
                    className={`w-full px-6 py-3 font-medium rounded-lg transition-colors ${
                      isRisky && !isClaimPending && !isClaimConfirming
                        ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    title={isRisky 
                      ? 'Submit claim for payout via blockchain transaction' 
                      : `Flood level must exceed smart contract threshold (${contractThreshold ? String(contractThreshold as bigint) : '...'}) to claim`
                    }
                  >
                    {claimingPolicyId === selectedPolicy.id ? (
                      isClaimConfirming ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Confirming Transaction...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      )
                    ) : (
                      ' Claim Payout Now (via MetaMask)'
                    )}
                  </button>
                )}
                <a
                  href={`https://hashscan.io/testnet/contract/${selectedPolicy.policyAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  View on HashScan Explorer →
                </a>
                {claimTxHash && claimingPolicyId === selectedPolicy.id && (
                  <a
                    href={`https://hashscan.io/testnet/transaction/${claimTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full px-4 py-2 bg-green-50 border border-green-300 text-green-800 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors"
                  >
                    View Claim Transaction →
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
