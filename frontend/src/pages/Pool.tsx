import { useState, useEffect } from 'react'
import { useWriteContract, useAccount } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { parseUnits } from 'viem'

const poolAbi = [
  {
    inputs: [],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
]

interface PoolData {
  tvl: number
  reserveRatio: number
}

function Pool() {
  const [poolData, setPoolData] = useState<PoolData>({ tvl: 0, reserveRatio: 0 })
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const { address } = useAccount()
  const { writeContract } = useWriteContract()
  const navigate = useNavigate()

  const backendUrl = import.meta.env.VITE_BACKEND_URL

  useEffect(() => {
    fetchPoolData()
    const interval = setInterval(fetchPoolData, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchPoolData = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/v1/pool`)
      const data = await response.json()
      setPoolData(data)
    } catch (error) {
      console.error('Error fetching pool data:', error)
    } finally {
      setLoading(false)
    }
  }

  const poolAddress = import.meta.env.VITE_POOL_ADDRESS as `0x${string}`

  const handleDeposit = () => {
    if (!depositAmount || !poolAddress) return
    writeContract({
      address: poolAddress,
      abi: poolAbi,
      functionName: 'deposit',
      value: parseUnits(depositAmount, 18), // Use 18 decimals for EVM compatibility
    })
    setDepositAmount('')
  }

  const handleWithdraw = () => {
    if (!withdrawAmount || !poolAddress) return
    writeContract({
      address: poolAddress,
      abi: poolAbi,
      functionName: 'withdraw',
      args: [parseUnits(withdrawAmount, 18)], // Use 18 decimals for EVM compatibility
    })
    setWithdrawAmount('')
  }

  const reserveHealth = Math.min((poolData.reserveRatio / 150) * 100, 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Insurance Pool</h1>
          <p className="text-gray-600 mb-8">Manage liquidity and monitor pool health</p>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Pool Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* TVL Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
                  <p className="text-gray-700 text-sm font-semibold mb-2">Total Value Locked</p>
                  <p className="text-4xl font-bold text-blue-600">{poolData.tvl.toFixed(2)} HBAR</p>
                  <p className="text-xs text-gray-600 mt-2">💰 Available liquidity for claims</p>
                </div>

                {/* Reserve Ratio Card */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
                  <p className="text-gray-700 text-sm font-semibold mb-2">Reserve Ratio</p>
                  <p className="text-4xl font-bold text-green-600">{poolData.reserveRatio.toFixed(1)}%</p>
                  <p className="text-xs text-gray-600 mt-2">📊 Required: 150% | Status: {poolData.reserveRatio >= 150 ? '✓ Healthy' : '⚠️ Low'}</p>
                </div>
              </div>

              {/* Reserve Ratio Progress */}
              <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                <div className="flex justify-between mb-2">
                  <p className="font-semibold text-gray-900">Pool Reserve Health</p>
                  <p className="text-sm text-gray-600">{reserveHealth.toFixed(1)}% Capacity</p>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      poolData.reserveRatio >= 150 ? 'bg-green-500' : poolData.reserveRatio >= 120 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${reserveHealth}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-600">
                  <span>0%</span>
                  <span>150%</span>
                </div>
              </div>

              {/* Admin Controls */}
              {address && (
                <div className="border-t-2 border-gray-200 pt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Controls</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Deposit */}
                    <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                      <h3 className="font-bold text-gray-900 mb-4">Add Liquidity</h3>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Amount in HBAR"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 mb-4"
                      />
                      <button
                        onClick={handleDeposit}
                        disabled={!depositAmount}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold rounded-lg transition-all"
                      >
                        + Deposit
                      </button>
                    </div>

                    {/* Withdraw */}
                    <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200">
                      <h3 className="font-bold text-gray-900 mb-4">Remove Liquidity</h3>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Amount in HBAR"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:outline-none focus:border-red-500 mb-4"
                      />
                      <button
                        onClick={handleWithdraw}
                        disabled={!withdrawAmount}
                        className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold rounded-lg transition-all"
                      >
                        - Withdraw
                      </button>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="mt-4 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800">
                      <span className="font-semibold">⚠️ Warning:</span> Ensure reserve ratio stays above 150% to support claims.
                    </p>
                  </div>
                </div>
              )}

              {/* Information */}
              <div className="bg-indigo-50 rounded-lg p-6 border-2 border-indigo-200">
                <h3 className="font-bold text-gray-900 mb-3">How it works</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• The pool maintains a 150% reserve ratio to ensure all claims can be paid</li>
                  <li>• Liquidity providers earn a portion of premiums</li>
                  <li>• Admins manage deposits and withdrawals to maintain health</li>
                  <li>• Current pool protects {Math.floor(poolData.tvl / 0.1)} policies with 0.1 HBAR coverage</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Pool