'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { betsAPI } from '@/lib/api'

export default function BrowseBets() {
  const router = useRouter()
  const [bets, setBets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [minOdds, setMinOdds] = useState('')
  const [maxOdds, setMaxOdds] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchBets()
  }, [category])

  const fetchBets = async () => {
    try {
      const res = await betsAPI.getAll({ status: 'OPEN' })
      setBets(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (betId: string) => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const res = await betsAPI.accept(betId)
      alert('Bet accepted! You can now view it in your dashboard.')
      fetchBets()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept bet')
    }
  }

  const filteredBets = bets.filter((bet: any) => {
    const matchesSearch = bet.topic.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'all' || bet.category === category
    const matchesMinOdds = !minOdds || bet.odds >= parseFloat(minOdds)
    const matchesMaxOdds = !maxOdds || bet.odds <= parseFloat(maxOdds)
    return matchesSearch && matchesCategory && matchesMinOdds && matchesMaxOdds
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl">Loading bets...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Bets</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search bets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Categories</option>
              <option value="Sports">Sports</option>
              <option value="Crypto">Crypto</option>
              <option value="Politics">Politics</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Weather">Weather</option>
              <option value="Business">Business</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="number"
              placeholder="Min Odds"
              value={minOdds}
              onChange={(e) => setMinOdds(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
            <input
              type="number"
              placeholder="Max Odds"
              value={maxOdds}
              onChange={(e) => setMaxOdds(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
            <button
              onClick={fetchBets}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBets.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No bets found matching your criteria
            </div>
          ) : (
            filteredBets.map((bet: any) => {
              const participantsJoined = bet.participants?.length || 0
              const isFull = participantsJoined >= bet.requiredParticipants

              return (
                <div key={bet._id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-gray-100 text-sm rounded-full">
                      {bet.category}
                    </span>
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      bet.direction === 'YES' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {bet.direction}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold mb-2">{bet.topic}</h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Stake:</span>
                      <span className="font-medium">{bet.stake} USDT</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Odds:</span>
                      <span className="font-medium">{bet.odds}x</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Potential Win:</span>
                      <span className="font-medium text-green-600">
                        {(bet.stake * bet.odds).toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Participants:</span>
                      <span className="font-medium">
                        {participantsJoined}/{bet.requiredParticipants}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Expires:</span>
                      <span className="text-xs">
                        {new Date(bet.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Created:</span>
                      <span className="text-xs">
                        {new Date(bet.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(participantsJoined / bet.requiredParticipants) * 100}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleAccept(bet._id)}
                    disabled={isFull}
                    className={`w-full py-2 rounded-lg font-medium ${
                      isFull
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isFull ? 'Bet Full' : 'Accept Bet'}
                  </button>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/bets/${bet._id}`)
                        alert('Link copied! Share it with friends.')
                      }}
                      className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center justify-center gap-1"
                    >
                      🔗 Copy Link
                    </button>
                    <button
                      onClick={() => {
                        const msg = `Check out this bet on FlowPredict!\n\n"${bet.topic}"\n${bet.direction} at ${bet.odds}x odds\nStake: ${bet.stake} USDT\n\nJoin here: ${window.location.origin}/bets/${bet._id}`
                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
                      }}
                      className="flex-1 py-2 px-3 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 flex items-center justify-center gap-1"
                    >
                      📱 WhatsApp
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}