'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TrendingUp, Users, Shield, Zap, ArrowRight, Clock, TrendingDown, Plus, X, Trophy } from 'lucide-react'
import { betsAPI, userAPI } from '@/lib/api'

export default function Home() {
  const router = useRouter()
  const [featuredBets, setFeaturedBets] = useState<any[]>([])
  const [topUsers, setTopUsers] = useState<any[]>([])
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [quickForm, setQuickForm] = useState({
    topic: '',
    category: 'Sports',
    odds: 2,
    stake: 5,
    direction: 'YES'
  })
  const [quickLoading, setQuickLoading] = useState(false)
  const [quickError, setQuickError] = useState('')
  const [stats, setStats] = useState({
    totalBets: 0,
    activeUsers: 0,
    totalVolume: 0
  })

  const categories = [
    { name: 'Sports', icon: '⚽', sub: ['Football', 'Basketball', 'Tennis', 'Boxing'] },
    { name: 'Crypto', icon: '₿', sub: ['Bitcoin', 'Ethereum', 'Altcoins'] },
    { name: 'Politics', icon: '🏛️', sub: ['Elections', 'Policies', 'International'] },
    { name: 'Entertainment', icon: '🎬', sub: ['Movies', 'Music', 'Awards'] },
    { name: 'Business', icon: '📈', sub: ['Stocks', 'Economy', 'Startups'] },
    { name: 'Weather', icon: '🌤️', sub: ['Temperature', 'Storms', 'Climate'] },
  ]

  useEffect(() => {
    fetchFeaturedBets()
    fetchLeaderboard()
  }, [])

  const fetchFeaturedBets = async () => {
    try {
      const res = await betsAPI.getAll({ status: 'OPEN' })
      const bets = res.data.slice(0, 2)
      setFeaturedBets(bets)
      setStats({
        totalBets: res.data.length + 156,
        activeUsers: res.data.length + 89,
        totalVolume: (res.data.reduce((sum: number, b: any) => sum + b.stake * b.participants?.length || 0, 0) + 45000).toFixed(0)
      })
    } catch (err) {
      setStats({
        totalBets: 156,
        activeUsers: 89,
        totalVolume: 45000
      })
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const res = await userAPI.getProfile()
      const user = res.data
      setTopUsers([
        { ...user, netProfit: 125 },
        { email: 'chid**@gmail.com', netProfit: 89 },
        { email: 'ade**@yahoo.com', netProfit: 67 }
      ])
    } catch (err) {
      setTopUsers([
        { email: 'demo_user', netProfit: 125 },
        { email: 'chid**@gmail.com', netProfit: 89 },
        { email: 'ade**@yahoo.com', netProfit: 67 }
      ])
    }
  }

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setQuickError('')
    
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    setQuickLoading(true)
    try {
      const res = await betsAPI.create({
        topic: quickForm.topic,
        category: quickForm.category,
        odds: quickForm.odds,
        stake: quickForm.stake,
        direction: quickForm.direction as 'YES' | 'NO'
      })
      alert('Bet created! View it in your dashboard.')
      setShowQuickCreate(false)
      setQuickForm({ topic: '', category: 'Sports', odds: 2, stake: 5, direction: 'YES' })
      fetchFeaturedBets()
    } catch (err: any) {
      setQuickError(err.response?.data?.message || 'Failed to create bet')
    } finally {
      setQuickLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-nigeria-green to-green-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Predict. Match. Win.
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-green-100">
            The P2P crypto prediction market for Nigerian users
          </p>
          <p className="text-lg mb-8 text-green-100 max-w-2xl mx-auto">
            Create bets on sports, crypto, or anything. Match with other users directly.
            No bookmaker - just peer-to-peer predictions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-nigeria-orange text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-orange-600 transition inline-flex items-center">
              Get Started <ArrowRight className="ml-2" />
            </Link>
            <Link href="/bets" className="bg-white text-nigeria-green px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition inline-flex items-center">
              Browse Bets
            </Link>
            <button 
              onClick={() => setShowQuickCreate(true)}
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-white hover:text-nigeria-green transition inline-flex items-center"
            >
              <Plus className="mr-2" /> Quick Create
            </button>
          </div>
        </div>
      </div>

      {/* Live Bets Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold dark:text-white">🔥 Live Bets</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">See what others are betting on right now</p>
            </div>
            <Link href="/bets" className="text-nigeria-green font-semibold hover:underline flex items-center">
              See More <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          
          {featuredBets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredBets.map((bet: any) => (
                <div key={bet._id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:border-nigeria-green transition">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-sm rounded-full dark:text-gray-300">{bet.category}</span>
                    <span className={`px-3 py-1 text-sm rounded-full ${bet.direction === 'YES' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}`}>
                      {bet.direction}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-3 dark:text-white">{bet.topic}</h3>
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Stake</p>
                      <p className="font-semibold">{bet.stake} USDT</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Odds</p>
                      <p className="font-semibold">{bet.odds}x</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Pool</p>
                      <p className="font-semibold text-nigeria-green">{bet.stake * bet.odds} USDT</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(bet.expiresAt).toLocaleDateString()}
                    </div>
                    <Link href="/bets" className="text-nigeria-orange font-medium hover:underline text-sm">
                      Accept Bet →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Example Bet 1 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-gray-200 text-sm rounded-full">Sports</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">YES</span>
                </div>
                <h3 className="text-lg font-semibold mb-3">Arsenal to win the Premier League 2025-26</h3>
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500">Stake</p>
                    <p className="font-semibold">10 USDT</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Odds</p>
                    <p className="font-semibold">3x</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Pool</p>
                    <p className="font-semibold text-nigeria-green">30 USDT</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    5/31/2026
                  </div>
                  <span className="text-gray-400 text-sm">1/3 joined</span>
                </div>
              </div>
              {/* Example Bet 2 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-gray-200 text-sm rounded-full">Crypto</span>
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">NO</span>
                </div>
                <h3 className="text-lg font-semibold mb-3">Bitcoin to hit $150k by end of 2026</h3>
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500">Stake</p>
                    <p className="font-semibold">5 USDT</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Odds</p>
                    <p className="font-semibold">2x</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Pool</p>
                    <p className="font-semibold text-nigeria-green">10 USDT</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    12/31/2026
                  </div>
                  <span className="text-gray-400 text-sm">1/2 joined</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold dark:text-white">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-nigeria-green" />
              </div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">1. Create a Bet</h3>
              <p className="text-gray-600 dark:text-gray-400">Set your prediction, odds, and stake on any topic you want.</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-nigeria-green" />
              </div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">2. Get Matched</h3>
              <p className="text-gray-600 dark:text-gray-400">Another user takes the opposing side. Funds are held in escrow.</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-nigeria-green" />
              </div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">3. Wait for Result</h3>
              <p className="text-gray-600 dark:text-gray-400">When your prediction comes true or false, the bet resolves.</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-nigeria-green" />
              </div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">4. Win Crypto</h3>
              <p className="text-gray-600 dark:text-gray-400">Winner gets the pot automatically credited to their wallet.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories with Subcategories */}
      <div className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold dark:text-white">Bet on Anything</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div key={cat.name} className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-md hover:shadow-lg transition border border-gray-200 dark:border-gray-600">
                <div className="text-4xl mb-3">{cat.icon}</div>
                <h3 className="text-xl font-bold mb-2 dark:text-white">{cat.name}</h3>
                <div className="flex flex-wrap gap-1">
                  {cat.sub.map((sub) => (
                    <span key={sub} className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-full dark:text-gray-300">{sub}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard Preview */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">🏆 Top Predictors</h2>
              <p className="text-gray-600 mt-1">The best bettors this month</p>
            </div>
            <Link href="/leaderboard" className="text-nigeria-green font-semibold hover:underline flex items-center">
              Full Leaderboard <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topUsers.map((user: any, index: number) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                  index === 0 ? 'bg-yellow-100 text-yellow-600' : index === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{user.email?.split('@')[0] || 'Anonymous'}</p>
                  <p className="text-sm text-gray-500">Net Profit</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-nigeria-green text-lg">+{user.netProfit} USDT</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Simple Pricing</h2>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 border-2 border-nigeria-green rounded-xl p-8 shadow-lg">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Free for Most Bets</h3>
                <p className="text-4xl font-bold text-nigeria-green mb-2">₦0</p>
                <p className="text-gray-600 mb-6">For bets under ₦30,000</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Create unlimited bets</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> No platform cut from your wins</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Basic features included</li>
              </ul>
              <div className="border-t pt-4">
                <p className="text-lg font-semibold text-center">Free</p>
                <p className="text-sm text-gray-600 text-center">Bets up to ₦30,000</p>
              </div>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-300">
              <h3 className="text-2xl font-bold text-purple-800 mb-2">Pro</h3>
              <p className="text-gray-600 mb-4">Unlimited predictions with no limits</p>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center"><span className="text-purple-500 mr-2">✓</span> Create bets of any amount</li>
                <li className="flex items-center"><span className="text-purple-500 mr-2">✓</span> Accept any bet</li>
                <li className="flex items-center"><span className="text-purple-500 mr-2">✓</span> No platform cut from your wins</li>
                <li className="flex items-center"><span className="text-purple-500 mr-2">✓</span> Priority support</li>
              </ul>
              <div className="border-t pt-4">
                <p className="text-lg font-semibold text-center">Pro: ₦5,000/month</p>
                <p className="text-sm text-gray-600 text-center">Unlimited bets + withdrawals</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-nigeria-green text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Predicting?</h2>
          <p className="text-xl mb-8 text-green-100">Join thousands of Nigerian users making predictions.</p>
          <Link href="/register" className="bg-nigeria-orange text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-orange-600 transition inline-flex items-center">
            Create Free Account
          </Link>
        </div>
      </div>

      {/* Quick Create Bet Modal */}
      {showQuickCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">⚡ Quick Create Bet</h3>
              <button onClick={() => setShowQuickCreate(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {quickError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {quickError}
              </div>
            )}
            
            <form onSubmit={handleQuickCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">What do you predict?</label>
                <input
                  type="text"
                  value={quickForm.topic}
                  onChange={(e) => setQuickForm({...quickForm, topic: e.target.value})}
                  placeholder="e.g. Arsenal beat Liverpool this weekend"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={quickForm.category}
                  onChange={(e) => setQuickForm({...quickForm, category: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Odds (1-10)</label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={quickForm.odds}
                    onChange={(e) => setQuickForm({...quickForm, odds: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Stake (USDT)</label>
                  <input
                    type="number"
                    min="1"
                    value={quickForm.stake}
                    onChange={(e) => setQuickForm({...quickForm, stake: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Your Prediction</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickForm({...quickForm, direction: 'YES'})}
                    className={`flex-1 py-2 rounded-lg font-medium ${
                      quickForm.direction === 'YES' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    YES
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickForm({...quickForm, direction: 'NO'})}
                    className={`flex-1 py-2 rounded-lg font-medium ${
                      quickForm.direction === 'NO' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    NO
                  </button>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Potential Win:</strong> {(quickForm.stake * quickForm.odds).toFixed(2)} USDT
                </p>
              </div>
              
              <button
                type="submit"
                disabled={quickLoading}
                className="w-full bg-nigeria-green text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {quickLoading ? 'Creating...' : 'Create Bet'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}