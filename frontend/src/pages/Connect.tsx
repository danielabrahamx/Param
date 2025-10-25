import { useConnect, useAccount } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function Connect() {
  const { connectors, connect } = useConnect()
  const { isConnected } = useAccount()
  const navigate = useNavigate()

  useEffect(() => {
    if (isConnected) {
      navigate('/dashboard')
    }
  }, [isConnected, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Paramify</h1>
          <p className="text-lg text-gray-600">Decentralized Flood Insurance</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Get Started</h2>
            <p className="text-gray-600">Connect your wallet to access the insurance platform</p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">0%</div>
              <p className="text-xs text-gray-600">Fees</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 mb-1">24/7</div>
              <p className="text-xs text-gray-600">Coverage</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">100%</div>
              <p className="text-xs text-gray-600">Transparent</p>
            </div>
          </div>

          {/* Connect Buttons */}
          <div className="space-y-3">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => connect({ connector })}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
              >
                <span className="flex items-center justify-center gap-2">
                  {connector.name === 'MetaMask' && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.06 3.28L11.3 9.81v4.36L20.06 3.28z" />
                      <path d="M3.94 3.28L12.7 9.81v4.36L3.94 3.28z" />
                      <path d="M17.65 12.09l-7.15 4.47v3.42l7.15-4.47v-3.42z" />
                      <path d="M6.35 12.09l7.15 4.47v3.42l-7.15-4.47v-3.42z" />
                      <path d="M12 17.56l-7.15-4.47v3.42L12 20.98l7.15-4.47v-3.42L12 17.56z" />
                    </svg>
                  )}
                  Connect {connector.name}
                </span>
              </button>
            ))}
          </div>

          {/* Network Info */}
          <div className="space-y-2">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-purple-900 font-semibold mb-2">
                🌐 Supported Networks:
              </p>
              <ul className="text-sm text-purple-800 space-y-1 ml-4">
                <li>• Hedera Testnet (Chain ID: 296) - Primary Network</li>
                <li>• Local Hardhat Node (for development)</li>
              </ul>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-900">
                💡 <span className="font-semibold">Tip:</span> Get free test HBAR from the{' '}
                <a href="https://portal.hedera.com/" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                  Hedera Portal
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          © 2025 Paramify. All rights reserved.
        </p>
      </div>
    </div>
  )
}