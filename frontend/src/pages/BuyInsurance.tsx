import { useEffect, useMemo, useState } from 'react'
import { parseEther, formatEther, decodeEventLog } from 'viem'
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useChainId,
  useSwitchChain,
  useReadContract,
  useBalance,
} from 'wagmi'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { hederaTestnet, NORMALIZED_ADDRESSES } from '../wagmi'

// PolicyFactory ABI with PolicyCreated event
const policyFactoryAbi = [
  {
    inputs: [{ internalType: 'uint256', name: '_coverage', type: 'uint256' }],
    name: 'createPolicy',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'policyAddress', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'coverage', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'premium', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'policyholder', type: 'address' },
    ],
    name: 'PolicyCreated',
    type: 'event',
  },
]
const policyFactoryAddress = NORMALIZED_ADDRESSES.POLICY_FACTORY

const governanceAbi = [
  {
    inputs: [],
    name: 'premiumRate',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]
const governanceAddress = NORMALIZED_ADDRESSES.GOVERNANCE

const poolAddress = NORMALIZED_ADDRESSES.POOL

// Validate contract address is loaded
if (!policyFactoryAddress || policyFactoryAddress === '') {
  console.error('❌ POLICY_FACTORY_ADDRESS not loaded from environment!')
  console.error('Check that VITE_POLICY_FACTORY_ADDRESS is set in .env')
}

if (!governanceAddress || governanceAddress === '') {
  console.error('❌ GOVERNANCE_ADDRESS not loaded from environment!')
  console.error('Check that VITE_GOVERNANCE_ADDRESS is set in .env')
}

if (!poolAddress || poolAddress === '') {
  console.error('❌ POOL_ADDRESS not loaded from environment!')
  console.error('Check that VITE_POOL_ADDRESS is set in .env')
}

export default function BuyInsurance() {
  const [coverage, setCoverage] = useState('')
  const coverageWei = coverage ? parseEther(coverage) : 0n
  const {
    data: premiumRateRaw,
    error: premiumRateError,
    isPending: isPremiumRatePending,
  } = useReadContract({
    address: governanceAddress,
    abi: governanceAbi,
    functionName: 'premiumRate',
    chainId: hederaTestnet.id,
    // Skip the call if we do not have a governance contract configured
    query: { enabled: Boolean(governanceAddress) },
  })

  const premiumRate = useMemo(() => (premiumRateRaw ?? 0n) as bigint, [premiumRateRaw])
  const premiumRateLabel = premiumRate > 0n ? `${premiumRate.toString()}%` : '—'
  // Align front-end payment with on-chain premium rate to avoid underpaying and reverts
  const premiumWei = coverage && premiumRate > 0n ? (coverageWei * premiumRate) / 100n : 0n
  const premium = coverage ? formatEther(premiumWei) : '0'
  const {
    data: poolBalanceData,
    error: poolBalanceError,
    isPending: isPoolBalancePending,
  } = useBalance({
    address: poolAddress ? (poolAddress as `0x${string}`) : undefined,
    chainId: hederaTestnet.id,
    query: { enabled: Boolean(poolAddress) },
  })
  const poolBalanceWei = poolBalanceData?.value ?? 0n
  // On Hedera EVM, balance is in wei (18 decimals) just like Ethereum
  // Use formatEther to display it properly
  const poolBalance = poolBalanceWei > 0n ? formatEther(poolBalanceWei) : '0'
  const { writeContract, data: hash, error: writeError } = useWriteContract()
  const { isLoading, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash })
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const navigate = useNavigate()
  const [isSavingPolicy, setIsSavingPolicy] = useState(false)

  // Log errors for debugging
  if (writeError) {
    console.error('❌ Transaction Error:', writeError)
    console.error('Error details:', {
      message: writeError.message,
      name: writeError.name,
      cause: writeError.cause,
    })
  }

  useEffect(() => {
    if (premiumRateError) {
      console.error('❌ Failed to load premium rate from Governance contract:', premiumRateError)
    }
  }, [premiumRateError])

  useEffect(() => {
    if (poolBalanceError) {
      console.error('❌ Failed to load current pool balance:', poolBalanceError)
    }
  }, [poolBalanceError])

  // Convert coverage (18 decimals / wei) to tinybar (8 decimals) for comparison with pool balance
  const coverageTinybar = coverageWei / 10n ** 10n

  // Handle successful transaction - save policy to backend
  useEffect(() => {
    if (isSuccess && receipt && address && !isSavingPolicy) {
      const savePolicyToBackend = async () => {
        try {
          setIsSavingPolicy(true)
          console.log('✅ Transaction confirmed on blockchain, saving to backend...')
          console.log('Receipt:', receipt)
          
          const backendUrl = import.meta.env.VITE_BACKEND_URL
          
          // Decode PolicyCreated event from receipt logs
          let policyAddress = '0x0000000000000000000000000000000000000000'
          let eventCoverage = coverage
          let eventPremium = premium
          
          try {
            // Find the PolicyCreated event in the logs
            for (const log of receipt.logs) {
              try {
                const decoded = decodeEventLog({
                  abi: policyFactoryAbi,
                  data: log.data,
                  topics: log.topics,
                })
                
                if (decoded.eventName === 'PolicyCreated' && decoded.args) {
                  console.log('📝 Decoded PolicyCreated event:', decoded)
                  const args = decoded.args as any
                  policyAddress = args.policyAddress as string
                  eventCoverage = formatEther(args.coverage as bigint)
                  eventPremium = formatEther(args.premium as bigint)
                  console.log(`✅ Found policy address: ${policyAddress}`)
                  break
                }
              } catch (e) {
                // Not the event we're looking for, continue
                continue
              }
            }
          } catch (error) {
            console.warn('⚠️ Could not decode event, will use fallback', error)
          }
          
          const premiumHbar = parseFloat(eventPremium)
          const coverageHbar = parseFloat(eventCoverage)
          
          // Save policy to backend with real policy address
          await axios.post(`${backendUrl}/api/v1/policies`, {
            coverage: coverageHbar,
            premium: premiumHbar,
            policyholder: address,
            policyAddress: policyAddress,
          })
          
          console.log('✅ Policy saved to backend successfully!')
          
          // Show success message and redirect
          alert(`✅ Insurance policy purchased!\n\nCoverage: ${coverageHbar} HBAR\nPremium: ${premiumHbar} HBAR\nPolicy: ${policyAddress.slice(0, 10)}...${policyAddress.slice(-8)}\n\nRedirecting to dashboard...`)
          
          // Redirect to dashboard
          navigate('/dashboard')
        } catch (error: any) {
          console.error('❌ Error saving policy to backend:', error)
          alert(`⚠️ Blockchain transaction succeeded but failed to save to database.\n\nThis is a display issue. Please refresh or contact support.\n\nTransaction Hash: ${hash}`)
          
          // Still navigate to dashboard so user can see the transaction
          setTimeout(() => navigate('/dashboard'), 2000)
        } finally {
          setIsSavingPolicy(false)
        }
      }
      
      savePolicyToBackend()
    }
  }, [isSuccess, receipt, address, isSavingPolicy, coverage, premium, hash, navigate])

  const handleBuy = () => {
    if (!coverage || !isConnected) {
      console.warn('Cannot buy insurance:', { coverage, isConnected })
      return
    }

    if (!policyFactoryAddress) {
      console.error('Policy factory address missing; aborting purchase')
      return
    }

    if (!governanceAddress) {
      console.error('Governance address missing; aborting purchase')
      return
    }

    if (premiumRate === 0n) {
      console.error('Premium rate unavailable; aborting purchase')
      return
    }
    
    if (poolBalanceWei < coverageTinybar) {
      console.warn('Pool liquidity insufficient for requested coverage', {
        requestedCoverage: coverageTinybar.toString(),
        availableLiquidity: poolBalanceWei.toString(),
      })
      return
    }

    // Force switch to Hedera Testnet if not already on it
    if (chainId !== hederaTestnet.id) {
      console.log('Switching to Hedera Testnet...')
      switchChain({ chainId: hederaTestnet.id })
      return
    }
    
    console.log('Initiating createPolicy transaction:', {
      address: policyFactoryAddress,
      coverage,
      coverageWei: coverageWei.toString(),
      premium,
      premiumWei: premiumWei.toString(),
      chainId: hederaTestnet.id,
    })
    
    writeContract({
      address: policyFactoryAddress,
      abi: policyFactoryAbi,
      functionName: 'createPolicy',
      args: [coverageWei],
      value: premiumWei, // Send premium in wei - contract will convert to tinybar if needed
      chainId: hederaTestnet.id,
      gas: 1_000_000n, // Explicit gas limit for Hedera
    })
  }

  const isWrongNetwork = chainId !== hederaTestnet.id
  const isBuyDisabled =
    !coverage ||
    parseFloat(coverage) < 0.1 ||
    isLoading ||
    isPremiumRatePending ||
    premiumRate === 0n ||
    isPoolBalancePending ||
    poolBalanceWei < coverageTinybar

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-gray-600 mb-4">Please connect your wallet first</p>
          <button
            onClick={() => navigate('/connect')}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200"
          >
            Go to Connect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Get Coverage</h1>
          <p className="text-gray-600 mb-8">Protect your property with flood insurance</p>

          {/* Wrong Network Warning */}
          {isWrongNetwork && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-900 mb-2">Wrong Network!</p>
                  <p className="text-sm text-red-800 mb-3">Please switch to Hedera Testnet to buy insurance.</p>
                  <button
                    onClick={() => switchChain({ chainId: hederaTestnet.id })}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-all"
                  >
                    Switch to Hedera Testnet
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Coverage Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">Coverage Amount</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={coverage}
                onChange={(e) => setCoverage(e.target.value)}
                placeholder="Enter amount in HBAR"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-lg"
              />
              <span className="absolute right-4 top-3 text-gray-500 font-medium">HBAR</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Min: 0.1 HBAR | Max: 100 HBAR</p>
          </div>

          {/* Premium Calculation */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Coverage:</span>
              <span className="font-bold text-gray-900">{coverage || '0'} HBAR</span>
            </div>
            <div className="border-t border-gray-300 pt-2 flex justify-between items-center">
              <span className="text-gray-700 font-semibold">Premium ({premiumRateLabel}):</span>
              <span className="font-bold text-lg text-blue-600">{premium} HBAR</span>
            </div>
            {premiumRateError && (
              <p className="text-xs text-red-600 mt-2">Could not load premium rate. Please retry.</p>
            )}
            {isPremiumRatePending && !premiumRateError && (
              <p className="text-xs text-gray-500 mt-2">Fetching current premium rate...</p>
            )}
            <div className="border-t border-dashed border-gray-300 mt-3 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 text-sm font-medium">Available Pool Liquidity:</span>
                <span className="text-sm font-semibold text-gray-900">{poolBalance} HBAR</span>
              </div>
              {poolBalanceError && (
                <p className="text-xs text-red-600 mt-2">Unable to fetch pool liquidity. Please retry later.</p>
              )}
              {isPoolBalancePending && !poolBalanceError && (
                <p className="text-xs text-gray-500 mt-2">Checking pool liquidity...</p>
              )}
              {coverage && poolBalanceWei < coverageTinybar && !isPoolBalancePending && !poolBalanceError && (
                <p className="text-xs text-red-600 mt-2">
                  Pool liquidity is below the requested coverage. Please lower coverage or ask the admin to top up the pool.
                </p>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">Instant coverage</span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">Auto payouts</span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">No middlemen</span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">Transparent</span>
            </div>
          </div>

          {/* Buy Button */}
          <button
            onClick={handleBuy}
            disabled={isBuyDisabled}
            className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:scale-100"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Buy Insurance'
            )}
          </button>

          {hash && (
            <div className="mt-4 p-3 bg-green-50 border border-green-300 rounded-lg">
              <p className="text-sm text-green-800">
                <span className="font-semibold">Transaction:</span> {hash.slice(0, 10)}...{hash.slice(-10)}
              </p>
            </div>
          )}

          {writeError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-sm text-red-800 font-semibold mb-1">Transaction Error:</p>
              <p className="text-xs text-red-700">
                {writeError.message?.includes('RPC endpoint') || writeError.message?.includes('HTTP client error')
                  ? 'Network connection issue with Hedera. Please try again in a moment.'
                  : writeError.message?.includes('user rejected')
                  ? 'Transaction was rejected in your wallet.'
                  : writeError.message?.includes('insufficient')
                  ? 'Insufficient funds. Please check your wallet balance.'
                  : writeError.message || 'Transaction failed. Please try again.'}
              </p>
              {(writeError.message?.includes('RPC') || writeError.message?.includes('HTTP')) && (
                <button
                  onClick={handleBuy}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Retry Transaction
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
