import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface Claim {
  id: number
  policyId: string
  amount: string
  status: 'pending' | 'approved' | 'rejected'
}

function Claims() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const backendUrl = import.meta.env.VITE_BACKEND_URL

  useEffect(() => {
    fetchClaims()
  }, [])

  const fetchClaims = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/v1/claims`)
      const data = await response.json()
      setClaims(data)
    } catch (error) {
      console.error('Error fetching claims:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (id: number, status: string) => {
    try {
      await fetch(`${backendUrl}/api/v1/claims/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchClaims()
    } catch (error) {
      console.error('Error updating claim:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved':
        return '✓'
      case 'rejected':
        return '✕'
      case 'pending':
        return '⏳'
      default:
        return '◯'
    }
  }

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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Claims</h1>
          <p className="text-gray-600 mb-8">Track the status of your insurance claims</p>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 mb-4">No claims yet. Your policies are protected.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => (
                <div key={claim.id} className="border-l-4 border-blue-500 bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Claim #{claim.id}</h3>
                      <p className="text-sm text-gray-600 mt-1">Policy: {claim.policyId.slice(0, 10)}...</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(claim.status)}`}>
                      {getStatusIcon(claim.status)} {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-600">Claim Amount:</p>
                    <p className="text-2xl font-bold text-gray-900">{claim.amount} HBAR</p>
                  </div>

                  {claim.status === 'pending' && (
                    <div className="flex gap-3 pt-4 border-t border-gray-300">
                      <button
                        onClick={() => handleReview(claim.id, 'approved')}
                        className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleReview(claim.id, 'rejected')}
                        className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Claims