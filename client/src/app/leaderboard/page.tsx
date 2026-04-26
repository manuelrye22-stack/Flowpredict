'use client'

import { useState, useEffect } from 'react'
import { betsAPI } from '@/lib/api'

interface UserStats {
  userId: string
  email: string
  totalBets: number
  wins: number
  losses: number
  winRate: number
  profit: number
}

export default function Leaderboard() {
  const [users, setUsers] = useState<UserStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      // Get all resolved bets
      const res = await betsAPI.getAll({ status: 'RESOLVED' })
      const bets = res.data

      // Aggregate stats per user
      const userMap = new Map<string, UserStats>()

      bets.forEach((bet: any) => {
        const winnerId = bet.winnerId?._id || bet.winnerId
        const winnerEmail = bet.winnerId?.email || 'Unknown'
        
        // Add win for winner
        if (winnerId) {
          const existing = userMap.get(winnerId) || {
            userId: winnerId,
            email: winnerEmail,
            totalBets: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            profit: 0
          }
          existing.wins++
          existing.totalBets++
          existing.profit += bet.stake * bet.odds
          userMap.set(winnerId, existing)
        }

        // Add loss for losers
        if (bet.participants) {
          bet.participants.forEach((p: any) => {
            const pId = p.userId?._id || p.userId
            if (pId && pId !== winnerId) {
              const existing = userMap.get(pId) || {
                userId: pId,
                email: p.userId?.email || 'Unknown',
                totalBets: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                profit: 0
              }
              existing.losses++
              existing.totalBets++
              existing.profit -= p.stake
              userMap.set(pId, existing)
            }
          })
        }
      })

      // Calculate win rates and convert to array
      const usersArray = Array.from(userMap.values()).map(user => ({
        ...user,
        winRate: user.totalBets > 0 ? Math.round((user.wins / user.totalBets) * 100) : 0
      }))

      // Sort by profit (descending)
      usersArray.sort((a, b) => b.profit - a.profit)

      setUsers(usersArray)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading leaderboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🏆 Leaderboard</h1>
          <p className="text-gray-600">Top predictors ranked by profit</p>
        </div>

        {users.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">No resolved bets yet!</p>
            <p className="text-gray-400 mt-2">Create some bets and start predicting to appear on the leaderboard.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top 3 */}
            {users.slice(0, 3).map((user, idx) => (
              <div 
                key={user.userId} 
                className={`bg-white rounded-xl shadow-lg p-6 flex items-center ${
                  idx === 0 ? 'border-4 border-yellow-400' : 
                  idx === 1 ? 'border-4 border-gray-300' : 
                  idx === 2 ? 'border-4 border-amber-600' : ''
                }`}
              >
                <div className="text-4xl font-bold w-16">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </div>
                <div className="flex-1 ml-4">
                  <p className="text-lg font-semibold">{user.email.split('@')[0]}</p>
                  <p className="text-sm text-gray-500">
                    {user.totalBets} bets | {user.wins} wins | {user.losses} losses | {user.winRate}% win rate
                  </p>
                </div>
                <div className={`text-2xl font-bold ${user.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {user.profit >= 0 ? '+' : ''}{user.profit} USDT
                </div>
              </div>
            ))}

            {/* Rest of users */}
            {users.slice(3).map((user, idx) => (
              <div key={user.userId} className="bg-white rounded-lg shadow p-4 flex items-center">
                <div className="text-xl font-bold w-12 text-gray-500">
                  #{idx + 4}
                </div>
                <div className="flex-1 ml-4">
                  <p className="font-semibold">{user.email.split('@')[0]}</p>
                  <p className="text-sm text-gray-500">
                    {user.totalBets} bets | {user.wins}W {user.losses}L | {user.winRate}%
                  </p>
                </div>
                <div className={`text-xl font-bold ${user.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {user.profit >= 0 ? '+' : ''}{user.profit} USDT
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>How ranking works:</strong> Users are ranked by net profit (wins - losses). 
            Create and resolve bets to climb the leaderboard!
          </p>
        </div>
      </div>
    </div>
  )
}