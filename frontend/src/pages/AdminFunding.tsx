import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import axios from 'axios'

interface Policy {
  id: number
  policyholder: string
  policyAddress: string
  coverage: number
  premium: number
  active: boolean
  payoutTriggered: boolean
  createdAt: string
}

interface PolicyBalance {
  policyId: number
  policyAddress: string
  coverage: number
  currentBalance: string
  shortfall: string
  needsFunding: boolean
}

export default function AdminFunding() {
  const { address, isConnected } = useAccount()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [balances, setBalances] = useState<PolicyBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [fundingPolicyId, setFundingPolicyId] = useState<number | null>(null)
  
  const { data: txHash, writeContract } = useWriteContract()
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ 
    hash: txHash 
  })

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

  useEffect(() => {
    fetchPoliciesAndBalances()
  }, [])

  useEffect(() => {
    if (isTxSuccess && fundingPolicyId) {
      alert('✅ Policy funded successfully! Refreshing balances...')
      setFundingPolicyId(null)
      setTimeout(() => fetchPoliciesAndBalances(), 2000)
    }
  }, [isTxSuccess, fundingPolicyId])

  const fetchPoliciesAndBalances = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/v1/policies')
      const policiesData = Array.isArray(res.data) ? res.data : (res.data.data || [])
      setPolicies(policiesData)

      const balanceChecks: PolicyBalance[] = []
      
      for (const policy of policiesData) {
        const balanceResponse = await fetch('https://testnet.hashio.io/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [policy.policyAddress, 'latest'],
            id: 1
          })
        })
        
        const balanceData = await balanceResponse.json()
        const policyBalanceWei = BigInt(balanceData.result || '0')
        const coverageWei = BigInt(policy.coverage) * BigInt(1e18)
        
        const shortfall = coverageWei > policyBalanceWei ? coverageWei - policyBalanceWei : 0n
        
        balanceChecks.push({
          policyId: policy.id,
          policyAddress: policy.policyAddress,
          coverage: policy.coverage,
          currentBalance: (Number(policyBalanceWei) / 1e18).toFixed(2),
          shortfall: (Number(shortfall) / 1e18).toFixed(2),
          needsFunding: shortfall > 0n
        })
      }
      
      setBalances(balanceChecks)
    } catch (error) {
      console.error('Error fetching policies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFundPolicy = (balance: PolicyBalance) => {
    const coverageWei = BigInt(balance.coverage) * BigInt(1e18)
    const poolAddress = import.meta.env.VITE_POOL_ADDRESS as `0x${string}`
    
    setFundingPolicyId(balance.policyId)
    
    console.log('🏦 Admin funding policy:', {
      poolAddress,
      policyAddress: balance.policyAddress,
      coverageWei: coverageWei.toString(),
      coverageHBAR: balance.coverage,
    })
    
    writeContract({
      address: poolAddress,
      abi: poolAbi,
      functionName: 'fundPolicy',
      args: [balance.policyAddress as `0x${string}`, coverageWei],
    })
  }

  const underfundedPolicies = balances.filter(b => b.needsFunding)
  const fullyFundedPolicies = balances.filter(b => !b.needsFunding)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🔧 Admin: Fund Policies</h1>
              <p className="text-gray-600 mt-2">
                Manually fund underfunded policy contracts from the InsurancePool
              </p>
            </div>
            {isConnected ? (
              <div className="text-right">
                <div className="text-sm text-gray-600">Connected as</div>
                <div className="font-mono text-sm bg-green-100 px-3 py-1 rounded">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
              </div>
            ) : (
              <div className="text-yellow-600 font-semibold">
                ⚠️ Connect wallet as pool owner
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-xl text-gray-600">Loading policies...</div>
            </div>
          ) : (
            <>
              {underfundedPolicies.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-red-600 mb-4">
                    ⚠️ Underfunded Policies ({underfundedPolicies.length})
                  </h2>
                  <div className="space-y-4">
                    {underfundedPolicies.map((balance) => {
                      const policy = policies.find(p => p.id === balance.policyId)
                      const isFunding = fundingPolicyId === balance.policyId
                      
                      return (
                        <div key={balance.policyId} className="border-2 border-red-300 rounded-lg p-6 bg-red-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg font-bold text-gray-900">
                                  Policy #{balance.policyId}
                                </span>
                                <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
                                  NEEDS FUNDING
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                <div>
                                  <span className="text-gray-600">Policy Address:</span>
                                  <div className="font-mono text-xs bg-white px-2 py-1 rounded mt-1">
                                    {balance.policyAddress}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Policyholder:</span>
                                  <div className="font-mono text-xs bg-white px-2 py-1 rounded mt-1">
                                    {policy?.policyholder}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Required:</span>
                                  <div className="font-bold text-gray-900">{balance.coverage} HBAR</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Current Balance:</span>
                                  <div className="font-bold text-red-600">{balance.currentBalance} HBAR</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Shortfall:</span>
                                  <div className="font-bold text-red-600">-{balance.shortfall} HBAR</div>
                                </div>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleFundPolicy(balance)}
                              disabled={!isConnected || isFunding || isTxConfirming}
                              className={`ml-6 px-6 py-3 rounded-lg font-semibold transition-colors ${
                                !isConnected || isFunding || isTxConfirming
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {isFunding && isTxConfirming ? (
                                '⏳ Funding...'
                              ) : (
                                `💰 Fund ${balance.coverage} HBAR`
                              )}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {fullyFundedPolicies.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-green-600 mb-4">
                    ✅ Fully Funded Policies ({fullyFundedPolicies.length})
                  </h2>
                  <div className="space-y-3">
                    {fullyFundedPolicies.map((balance) => {
                      const policy = policies.find(p => p.id === balance.policyId)
                      
                      return (
                        <div key={balance.policyId} className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-bold text-gray-900">Policy #{balance.policyId}</span>
                                <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded">
                                  FUNDED
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Policy:</span>
                                  <div className="font-mono text-xs">{balance.policyAddress.slice(0, 10)}...</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Holder:</span>
                                  <div className="font-mono text-xs">{policy?.policyholder.slice(0, 10)}...</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Balance:</span>
                                  <div className="font-bold text-green-600">{balance.currentBalance} / {balance.coverage} HBAR</div>
                                </div>
                              </div>
                            </div>
                            <div className="text-3xl">✅</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {balances.length === 0 && (
                <div className="text-center py-12 text-gray-600">
                  No policies found
                </div>
              )}
            </>
          )}

          <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-300 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2">ℹ️ How This Works:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Connect your wallet as the InsurancePool owner</li>
              <li>Review underfunded policies (those with 0 HBAR balance)</li>
              <li>Click "Fund" to transfer coverage amount from pool to policy contract</li>
              <li>Once funded, policyholders can trigger payouts successfully</li>
            </ol>
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded text-sm">
              <strong>⚠️ Owner Access Required:</strong> Only the InsurancePool owner can call fundPolicy().
              Make sure you're connected with the correct wallet.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
