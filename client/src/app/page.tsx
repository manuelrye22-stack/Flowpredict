'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Users, Shield, Zap, ArrowRight, Clock, TrendingDown } from 'lucide-react'
import { betsAPI } from '@/lib/api'

export default function Home() {
  const [featuredBets, setFeaturedBets] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalBets: 0,
    activeUsers: 0,
    totalVolume: 0
  })

  useEffect(() => {
    fetchFeaturedBets()
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
          </div>
        </div>
      </div>

      {/* Live Bets Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">🔥 Live Bets</h2>
              <p className="text-gray-600 mt-1">See what others are betting on right now</p>
            </div>
            <Link href="/bets" className="text-nigeria-green font-semibold hover:underline flex items-center">
              See More <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          
          {featuredBets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredBets.map((bet: any) => (
                <div key={bet._id} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-nigeria-green transition">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-gray-200 text-sm rounded-full">{bet.category}</span>
                    <span className={`px-3 py-1 text-sm rounded-full ${bet.direction === 'YES' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {bet.direction}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{bet.topic}</h3>
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">Stake</p>
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
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-nigeria-green" />
              </div>
              <h3 className="text-lg font-semibold mb-2">1. Create a Bet</h3>
              <p className="text-gray-600">Set your prediction, odds, and stake on any topic you want.</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-nigeria-green" />
              </div>
              <h3 className="text-lg font-semibold mb-2">2. Get Matched</h3>
              <p className="text-gray-600">Another user takes the opposing side. Funds are held in escrow.</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-nigeria-green" />
              </div>
              <h3 className="text-lg font-semibold mb-2">3. Wait for Result</h3>
              <p className="text-gray-600">When your prediction comes true or false, the bet resolves.</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-nigeria-green" />
              </div>
              <h3 className="text-lg font-semibold mb-2">4. Win Crypto</h3>
              <p className="text-gray-600">Winner gets the pot automatically credited to their wallet.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Bet on Anything</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition">
              <div className="text-4xl mb-4">⚽</div>
              <h3 className="text-xl font-bold mb-2">Sports</h3>
              <p className="text-gray-600">Premier League, Champions League, NPFL, and more.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition">
              <div className="text-4xl mb-4">₿</div>
              <h3 className="text-xl font-bold mb-2">Crypto</h3>
              <p className="text-gray-600">Bitcoin, Ethereum, and altcoin price predictions.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2">Custom</h3>
              <p className="text-gray-600">Create any prediction - politics, entertainment, anything!</p>
            </div>
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
            <div className="bg-white border-2 border-nigeria-green rounded-xl p-8 shadow-lg">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Free for Most Bets</h3>
                <p className="text-4xl font-bold text-nigeria-green mb-2">₦0</p>
                <p className="text-gray-600 mb-6">For bets under ₦30,000</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Create unlimited bets</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Accept any bet</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> No platform cut from your wins</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Basic features included</li>
              </ul>
              <div className="border-t pt-4">
                <p className="text-lg font-semibold text-center">Pro: ₦2,000/month</p>
                <p className="text-sm text-gray-600 text-center">For bets over ₦30,000 + advanced features</p>
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
    </div>
  )
}