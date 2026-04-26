'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { walletAPI, betsAPI, verificationAPI, commentsAPI } from '@/lib/api'
import { toNaira, formatNaira, CRYPTO_OPTIONS } from '@/lib/constants'

const NAIRA_RATE = 1550

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [balance, setBalance] = useState<any>(null)
  const [myBets, setMyBets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCrypto, setSelectedCrypto] = useState('USDT')
  const [comments, setComments] = useState<any[]>([])
  const [selectedBetComments, setSelectedBetComments] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)

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

    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      const [walletRes, betsRes] = await Promise.all([
        walletAPI.getBalance(),
        betsAPI.getMyBets(),
      ])
      setBalance(walletRes.data)
      setMyBets(betsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const handleLeaveBet = async (betId: string) => {
    alert('Cannot leave - bets are binding once committed!')
  }

  const handleConsensusVote = async (betId: string, outcome: string) => {
    if (!confirm(`Confirm outcome: ${outcome}? This cannot be changed.`)) return
    
    try {
      const res = await verificationAPI.consensusVote(betId, outcome)
      alert(res.data.message)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to vote')
    }
  }

  const handleResolveBet = async (betId: string, winnerId: string) => {
    if (!confirm('Are you sure you want to resolve this bet? Winner will be paid.')) {
      return
    }
    try {
      const res = await betsAPI.resolve(betId, { 
        winnerId, 
        resolution: 'Resolved by creator' 
      })
      alert(`Bet resolved! Winner got ${res.data.payout} USDT`)
      fetchData()
    } catch (err: any) {
      console.error('Resolve error:', err)
      alert(err.response?.data?.message || 'Failed to resolve bet')
    }
  }

  const handleDispute = async (betId: string) => {
    const reason = prompt('Enter reason for dispute:')
    if (!reason) return
    
    try {
      const res = await betsAPI.dispute(betId, { reason })
      alert('Dispute raised! An admin will review.')
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to raise dispute')
    }
  }

  const loadComments = async (betId: string) => {
    try {
      const res = await commentsAPI.getComments(betId)
      setComments(res.data)
      setSelectedBetComments(betId)
    } catch (err) {
      console.error('Failed to load comments:', err)
    }
  }

  const handlePostComment = async (betId: string) => {
    if (!newComment.trim()) return
    setPostingComment(true)
    try {
      await commentsAPI.addComment(betId, { content: newComment })
      setNewComment('')
      loadComments(betId)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to post comment')
    } finally {
      setPostingComment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  const activeBets = myBets.filter((b: any) => b.status === 'OPEN' || b.status === 'MATCHED')
  const settledBets = myBets.filter((b: any) => b.status === 'RESOLVED')
  const usdtBalance = balance?.balance || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-nigeria-green text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Welcome, {user?.email?.split('@')[0]}</h1>
              <p className="text-green-200">
                Balance: {usdtBalance} USDT ({formatNaira(usdtBalance * NAIRA_RATE)})
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-green-700 px-4 py-2 rounded hover:bg-green-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Create Bet</h3>
            <p className="text-gray-600 text-sm mb-4">Start a new prediction</p>
            <Link
              href="/bets/create"
              className="block text-center bg-nigeria-green text-white py-2 rounded hover:bg-green-700"
            >
              Create
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-2">💳 Wallet</h3>
            <p className="text-gray-600 text-sm mb-4">Deposit, withdraw, faucet</p>
            <Link
              href="/profile"
              className="block text-center bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
            >
              Go to Wallet
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Browse Bets</h3>
            <p className="text-gray-600 text-sm mb-4">Find bets to accept</p>
            <Link
              href="/bets"
              className="block text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Browse
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-2">📊 Stats</h3>
            <p className="text-gray-600 text-sm mb-4">
              Win rate, profit/loss
            </p>
            <Link
              href="/profile"
              className="block text-center bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
            >
              View Stats
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-2">🏆 Leaderboard</h3>
            <p className="text-gray-600 text-sm mb-4">Top predictors</p>
            <Link
              href="/leaderboard"
              className="block text-center bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
            >
              View Rankings
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Admin</h3>
            <p className="text-gray-600 text-sm mb-4">Manage all bets</p>
            <Link
              href="/admin"
              className="block text-center bg-gray-800 text-white py-2 rounded hover:bg-gray-700"
            >
              Admin Panel
            </Link>
          </div>
</div>

        {/* Active Bets */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">Active Bets ({activeBets.length})</h3>
          {activeBets.length === 0 ? (
            <p className="text-gray-500">No active bets. Create one or browse available bets!</p>
          ) : (
            <div className="space-y-4">
              {activeBets.slice(0, 10).map((bet: any) => {
                const participantsJoined = bet.participants?.length || 0
                const isLocked = bet.status === 'MATCHED'
                const userIdStr = user?._id?.toString() || user?._id
                const creatorIdStr = bet.creatorId?._id?.toString() || bet.creatorId?.toString()
                const isCreator = userIdStr && creatorIdStr && userIdStr === creatorIdStr
                
                return (
                <div key={bet._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{bet.topic}</p>
                      <p className="text-sm text-gray-600">
                        {bet.category} | {bet.stake} USDT | {bet.odds}x odds
                      </p>
                      <p className="text-sm">
                        Participants: {participantsJoined}/{bet.requiredParticipants || bet.odds} 
                        {isLocked && <span className="ml-2 text-red-600 font-semibold">🔒 LOCKED</span>}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${isLocked ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                      {isLocked ? 'LOCKED' : 'OPEN'}
                    </span>
                  </div>
                  
                  {/* Action buttons - no opt out once committed */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-sm text-gray-500">
                      🔒 Committed - Cannot leave
                    </span>
                    
                    {/* Consensus voting - for all participants of locked consensus bets */}
                    {isLocked && (
                      <div className="mt-2 p-2 bg-purple-50 rounded-lg">
                        <p className="text-xs text-purple-700 mb-2">🤝 Consensus Bet - Vote on outcome:</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConsensusVote(bet._id, 'YES')}
                            className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            ✅ Vote YES
                          </button>
                          <button
                            onClick={() => handleConsensusVote(bet._id, 'NO')}
                            className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                          >
                            ❌ Vote NO
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Both participants must agree, or admin will resolve.
                        </p>
                      </div>
                    )}
                    
                    {/* Resolve button - only for creator of locked bets */}
                    {isLocked && isCreator && (
                      <div className="flex gap-2">
                        {bet.participants?.map((p: any, idx: number) => {
                          const pId = p.userId?._id?.toString() || p.userId?.toString() || p.userId
                          return (
                          <button
                            key={idx}
                            onClick={() => handleResolveBet(bet._id, pId)}
                            className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            ✅ Declare {p.direction === 'YES' ? 'YES' : 'NO'} winner
                          </button>
                        )})}
                      </div>
                    )}
                    
                    {/* Dispute button - for any participant of locked bets */}
                    {isLocked && (
<button
                        onClick={() => handleDispute(bet._id)}
                        className="text-sm text-orange-600 hover:underline"
                      >
                        ⚠️ Raise Dispute
                      </button>

                      {/* Comments toggle */}
                      <button
                        onClick={() => {
                          if (selectedBetComments === bet._id) {
                            setSelectedBetComments(null)
                          } else {
                            loadComments(bet._id)
                          }
                        }}
                        className="text-sm text-blue-600 hover:underline ml-2"
                      >
                        💬 Comments
                      </button>
                    </div>

                    {/* Comments display */}
                    {selectedBetComments === bet._id && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="space-y-2 mb-3">
                          {comments.length === 0 ? (
                            <p className="text-sm text-gray-500">No comments yet. Be the first!</p>
                          ) : (
                            comments.map((c: any) => (
                              <div key={c._id} className="text-sm border-b pb-2">
                                <span className="font-medium">{c.email}</span>: {c.content}
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 px-3 py-1 border rounded"
                          />
                          <button
                            onClick={() => handlePostComment(bet._id)}
                            disabled={postingComment || !newComment.trim()}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                          >
                            {postingComment ? '...' : 'Post'}
                          </button>
                        </div>
                      </div>
                    )}
                </div>
              )})}
            </div>
          )}
        </div>

        {/* Recent Settled Bets */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Settled Bets ({settledBets.length})</h3>
          {settledBets.length === 0 ? (
            <p className="text-gray-500">No settled bets yet.</p>
          ) : (
            <div className="space-y-4">
              {settledBets.slice(0, 5).map((bet: any) => (
                <div key={bet._id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{bet.topic}</p>
                    <p className="text-sm text-gray-600">
                      Stake: {bet.stake} USDT | Odds: {bet.odds}x
                    </p>
                    <p className="text-sm">
                      You bet: {bet.direction} | Result: {bet.winnerId === user?._id ? 'WON' : 'LOST'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${bet.winnerId === user?._id ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {bet.winnerId === user?._id ? 'WON' : 'LOST'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}