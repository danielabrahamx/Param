import { useState } from 'react'
import { useWriteContract, useAccount, useBalance } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { parseUnits, formatEther } from 'viem'
import { hederaTestnet } from '../wagmi'

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

function Pool() {
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const { address } = useAccount()
  const { writeContract } = useWriteContract()
  const navigate = useNavigate()

  const poolAddress = import.meta.env.VITE_POOL_ADDRESS as `0x${string}`

  const { data: poolBalanceData, isLoading: isBalanceLoading } = useBalance({
    address: poolAddress,
    chainId: hederaTestnet.id,
    query: { enabled: Boolean(poolAddress), refetchInterval: 10000 }
  })

  const poolBalanceWei = poolBalanceData?.value ?? 0n
  const tvl = poolBalanceWei > 0n ? parseFloat(formatEther(poolBalanceWei)) : 0

  const handleDeposit = () => {
    if (!depositAmount || !poolAddress) return
    writeContract({
      address: poolAddress,
      abi: poolAbi,
      functionName: 'deposit',
      value: parseUnits(depositAmount, 18),
    })
    setDepositAmount('')
  }

  const handleWithdraw = () => {
    if (!withdrawAmount || !poolAddress) return
    writeContract({
      address: poolAddress,
      abi: poolAbi,
      functionName: 'withdraw',
      args: [parseUnits(withdrawAmount, 18)],
    })
    setWithdrawAmount('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
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

          {isBalanceLoading ? (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
                <p className="text-gray-700 text-sm font-semibold mb-2">Total Value Locked</p>
                <p className="text-4xl font-bold text-blue-600">{tvl.toFixed(2)} HBAR</p>
                <p className="text-xs text-gray-600 mt-2">Available liquidity for claims</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                <div className="flex justify-between mb-2">
                  <p className="font-semibold text-gray-900">Pool Reserve Health</p>
                  <p className="text-sm text-gray-600">100.0% Capacity</p>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `100%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-600">
                  <span>0%</span>
                  <span>150%</span>
                </div>
              </div>

              {address && (
                <div className="border-t-2 border-gray-200 pt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Controls</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>
              )}

              <div className="bg-indigo-50 rounded-lg p-6 border-2 border-indigo-200">
                <h3 className="font-bold text-gray-900 mb-3">How it works</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• The pool provides liquidity to pay insurance claims</li>
                  <li>• Liquidity providers earn a portion of premiums</li>
                  <li>• Admins manage deposits and withdrawals</li>
                  <li>• Current pool balance: {tvl.toFixed(2)} HBAR (live from blockchain)</li>
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
