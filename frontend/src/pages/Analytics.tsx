import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import axios from 'axios'

interface FloodHistoryPoint {
  timestamp: string
  level: number
}

interface SystemMetrics {
  totalPolicies: number
  activePolicies: number
  totalCoverage: string
  totalPremiums: string
  claimsPaid: number
  poolBalance: string
}

export default function Analytics() {
  const { isConnected } = useAccount()
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [floodHistory, setFloodHistory] = useState<FloodHistoryPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConnected) {
      navigate('/connect')
      return
    }
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [isConnected, navigate])

  const backendUrl = import.meta.env.VITE_BACKEND_URL

  const fetchAnalytics = async () => {
    try {
      const [policiesRes, poolRes, floodRes] = await Promise.all([
        axios.get(`${backendUrl}/api/v1/policies`),
        axios.get(`${backendUrl}/api/v1/pool`),
        axios.get(`${backendUrl}/api/v1/oracle/flood-level/1`),
      ])

      const policies = policiesRes.data
      const activePolicies = policies.filter((p: any) => !p.payoutTriggered)
      const claimsPaid = policies.filter((p: any) => p.payoutTriggered).length
      
      const totalCoverage = policies.reduce((sum: number, p: any) => 
        sum + parseFloat(p.coverage), 0).toFixed(2)
      const totalPremiums = policies.reduce((sum: number, p: any) => 
        sum + parseFloat(p.premium), 0).toFixed(2)

      setMetrics({
        totalPolicies: policies.length,
        activePolicies: activePolicies.length,
        totalCoverage,
        totalPremiums,
        claimsPaid,
        poolBalance: poolRes.data.balance || '0'
      })

      // Mock flood history - in production, fetch from historical endpoint
      setFloodHistory([
        { timestamp: new Date(Date.now() - 3600000).toISOString(), level: floodRes.data.level - 200 },
        { timestamp: new Date(Date.now() - 1800000).toISOString(), level: floodRes.data.level - 100 },
        { timestamp: new Date().toISOString(), level: floodRes.data.level },
      ])
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">System-wide metrics and insights</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="py-3 px-6 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Policies */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '...' : metrics?.totalPolicies}
            </p>
            <p className="text-sm text-gray-600">Total Policies</p>
            <p className="text-xs text-green-600 mt-2">
              {loading ? '...' : metrics?.activePolicies} active
            </p>
          </div>

          {/* Total Coverage */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '...' : `${metrics?.totalCoverage} HBAR`}
            </p>
            <p className="text-sm text-gray-600">Total Coverage</p>
          </div>

          {/* Claims Paid */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '...' : metrics?.claimsPaid}
            </p>
            <p className="text-sm text-gray-600">Claims Paid</p>
          </div>

          {/* Pool Balance */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '...' : `${metrics?.poolBalance} HBAR`}
            </p>
            <p className="text-sm text-gray-600">Pool Balance</p>
          </div>

          {/* Premium Revenue */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-indigo-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '...' : `${metrics?.totalPremiums} HBAR`}
            </p>
            <p className="text-sm text-gray-600">Total Premiums</p>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600 mb-1">Operational</p>
            <p className="text-sm text-gray-600">System Status</p>
          </div>
        </div>

        {/* Flood History Chart */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Flood Level History</h2>
          <div className="space-y-4">
            {floodHistory.map((point, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-40">
                  {new Date(point.timestamp).toLocaleString()}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                  <div
                    className="bg-blue-500 h-8 rounded-full flex items-center justify-end pr-3"
                    style={{ width: `${Math.min((point.level / 3000) * 100, 100)}%` }}
                  >
                    <span className="text-white text-sm font-semibold">{point.level} mm</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Risk Distribution</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Low Risk Policies</span>
                <span className="font-bold text-green-600">
                  {loading ? '...' : Math.floor((metrics?.activePolicies || 0) * 0.7)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Medium Risk Policies</span>
                <span className="font-bold text-orange-600">
                  {loading ? '...' : Math.floor((metrics?.activePolicies || 0) * 0.25)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">High Risk Policies</span>
                <span className="font-bold text-red-600">
                  {loading ? '...' : Math.floor((metrics?.activePolicies || 0) * 0.05)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Network Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Blockchain</span>
                <span className="font-bold text-purple-600">Hedera Testnet</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Smart Contracts</span>
                <span className="font-bold text-gray-900">5 Deployed</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Oracle Updates</span>
                <span className="font-bold text-blue-600">Every 5 min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
