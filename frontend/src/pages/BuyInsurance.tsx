import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId, useSwitchChain } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { hederaTestnet } from '../wagmi'

// Placeholder ABI and address
const policyFactoryAbi = [
  {
    inputs: [{ internalType: 'uint256', name: '_coverage', type: 'uint256' }],
    name: 'createPolicy',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]
const policyFactoryAddress = import.meta.env.VITE_POLICY_FACTORY_ADDRESS as `0x${string}`

export default function BuyInsurance() {
  const [coverage, setCoverage] = useState('')
  const coverageWei = coverage ? BigInt(Math.floor(parseFloat(coverage) * 10 ** 18)) : BigInt(0)
  // Note: Premium is calculated by the contract based on governance.premiumRate()
  // For display purposes, we show 10% but the actual rate comes from the contract
  const premium = coverage ? (parseFloat(coverage) * 0.1).toString() : '0'
  const { writeContract, data: hash, error: writeError } = useWriteContract()
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash })
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const navigate = useNavigate()

  const handleBuy = () => {
    if (!coverage || !isConnected) return
    
    // Force switch to Hedera Testnet if not already on it
    if (chainId !== hederaTestnet.id) {
      switchChain({ chainId: hederaTestnet.id })
      return
    }
    
    writeContract({
      address: policyFactoryAddress,
      abi: policyFactoryAbi,
      functionName: 'createPolicy',
      args: [coverageWei],
      // DO NOT send value - the contract is not payable
      chainId: hederaTestnet.id,
    })
  }

  if (isSuccess) {
    navigate('/dashboard')
  }

  const isWrongNetwork = chainId !== hederaTestnet.id

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
              <span className="text-gray-700 font-semibold">Premium (10%):</span>
              <span className="font-bold text-lg text-blue-600">{premium} HBAR</span>
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
            disabled={!coverage || isLoading || parseFloat(coverage) < 0.1}
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
              <p className="text-sm text-red-800">
                <span className="font-semibold">Error:</span> {writeError.message || 'Transaction failed'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}