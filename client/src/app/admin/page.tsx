'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { betsAPI, verificationAPI, walletAPI } from '@/lib/api'

export default function AdminPanel() {
  const router = useRouter()
  const [bets, setBets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'MATCHED' | 'DISPUTED' | 'RESOLVED' | 'OPEN'>('MATCHED')
  const [user, setUser] = useState<any>(null)
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [activeSection, setActiveSection] = useState<'bets' | 'withdrawals'>('bets')
  const [platformBalance, setPlatformBalance] = useState<number>(0)
  const [processingAuto, setProcessingAuto] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }

    fetchBets()
    fetchWithdrawals()
  }, [router, filter])

  const fetchWithdrawals = async () => {
    try {
      const [withdrawalsRes, balanceRes] = await Promise.all([
        walletAPI.getPendingWithdrawals(),
        walletAPI.getAdminBalance(),
      ])
      setWithdrawals(withdrawalsRes.data)
      setPlatformBalance(balanceRes.data.usdtBalance || 0)
    } catch (err) {
      console.error(err)
    }
  }

  const handleProcessWithdrawal = async (id: string, action: string, txHash: string) => {
    if (!confirm('Are you sure you want to ' + action + ' this withdrawal?')) return

    try {
      await walletAPI.processWithdrawal(id, { action, txHash })
      alert('Withdrawal ' + action + 'ed!')
      fetchWithdrawals()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to ' + action)
    }
  }

  const fetchBets = async () => {
    try {
      const res = await betsAPI.getAll({ status: filter })
      setBets(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (betId: string, winnerId: string) => {
    if (!confirm('Resolve this bet and pay the winner?')) return

    try {
      const res = await betsAPI.resolve(betId, {
        winnerId,
        resolution: 'Admin resolved'
      })
      alert('Bet resolved! Payout: ' + res.data.payout + ' USDT')
      fetchBets()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to resolve')
    }
  }

  const handleDelete = async (betId: string) => {
    if (!confirm('Delete this bet? This will not refund anyone.')) return
    alert('Delete not implemented - contact developer')
  }

  const handleAutoVerify = async (betId: string) => {
    if (!confirm('Run auto-verification for this bet?')) return

    try {
      const res = await verificationAPI.autoVerify(betId)
      if (res.data.success) {
        alert('Auto-verification successful!\n\nResult: ' + res.data.outcome + '\nValue: ' + res.data.actualValue)
        fetchBets()
      } else {
        alert('Auto-verification failed\n\n' + (res.data.details || res.data.message))
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Auto-verify failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-8">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="bg-gray-800 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">FlowPredict Admin</h1>
            <p className="text-sm text-gray-300">Manage bets, resolve disputes</p>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-white hover:underline">Dashboard</Link>
            <a href="/" className="text-white hover:underline">Home</a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveSection('bets')}
            className={`px-4 py-2 rounded-lg font-medium ${activeSection === 'bets' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
          >
            Bets
          </button>
          <button
            onClick={() => setActiveSection('withdrawals')}
            className={`px-4 py-2 rounded-lg font-medium ${activeSection === 'withdrawals' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
          >
            Withdrawals ({withdrawals.length})
          </button>
        </div>

        {activeSection === 'bets' && (
          <div>
            <div className="flex gap-2 mb-6">
              {(['MATCHED', 'DISPUTED', 'RESOLVED', 'OPEN'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg ${filter === status ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {bets.length === 0 ? (
                <p className="text-gray-500">No bets found</p>
              ) : (
                bets.map((bet: any) => (
                  <div key={bet._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{bet.topic}</h3>
                        <p className="text-sm text-gray-500">{bet.category} | Odds: {bet.odds}x</p>
                        <p className="text-sm text-gray-500">Stake: {bet.stake} USDT</p>
                        <p className="text-sm text-gray-500">
                          Participants: {bet.participants?.length || 0}/{bet.requiredParticipants}
                        </p>
                        <p className="text-xs text-gray-400">
                          Expires: {new Date(bet.expiresAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleAutoVerify(bet._id)}
                          className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                        >
                          Auto-Verify
                        </button>
                        <button
                          onClick={() => handleDelete(bet._id)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {bet.participants && bet.participants.length > 0 && (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="font-medium mb-2">Participants:</h4>
                        <div className="space-y-2">
                          {bet.participants.map((p: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                              <span>{p.email || 'User ' + idx}</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleResolve(bet._id, p.userId)}
                                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                >
                                  Make Winner
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {bet.verification && (
                      <div className="mt-4 p-3 bg-blue-50 rounded">
                        <p className="text-sm"><strong>Verification:</strong> {bet.verification.sourceType}</p>
                        {bet.verification.sourceUrl && <p className="text-xs text-gray-500">{bet.verification.sourceUrl}</p>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeSection === 'withdrawals' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Pending Withdrawals</h2>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Platform Balance</p>
                  <p className="text-xl font-bold text-green-600">{platformBalance.toFixed(2)} USDT</p>
                </div>
                <button
                  onClick={fetchWithdrawals}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>
            </div>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium">Platform Wallet (Auto-Withdrawal Enabled):</p>
              <div className="flex mt-1">
                <input
                  type="text"
                  value="TCN1bFogyZbzdiBC87VNhARfT5BK1GthiS"
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-l-lg bg-gray-50 text-sm font-mono"
                />
                <button
                  onClick={() => navigator.clipboard.writeText('TCN1bFogyZbzdiBC87VNhARfT5BK1GthiS')}
                  className="bg-blue-600 text-white px-3 py-2 rounded-r-lg text-sm"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Withdrawals auto-process every 60 seconds</p>
            </div>

            {withdrawals.length === 0 ? (
              <p className="text-gray-500">No pending withdrawals</p>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((w: any) => (
                  <div key={w._id} className="border p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-lg">{w.amount} USDT</p>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">Withdrawal Address:</p>
                          <div className="flex mt-1">
                            <input
                              type="text"
                              value={w.address}
                              readOnly
                              className="flex-1 px-3 py-2 border rounded-l-lg bg-gray-50 text-sm font-mono"
                            />
                            <button
                              onClick={() => navigator.clipboard.writeText(w.address)}
                              className="bg-green-600 text-white px-3 py-2 rounded-r-lg text-sm"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          User: {w.userId?.email || 'Unknown user'} | {new Date(w.requestedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => {
                            const txHash = prompt('Enter TX hash after sending USDT:')
                            if (txHash) handleProcessWithdrawal(w._id, 'approve', txHash)
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleProcessWithdrawal(w._id, 'reject', '')}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}