'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Users, Shield, Zap, ArrowRight } from 'lucide-react'

export default function Home() {
  const [stats, setStats] = useState({
    totalBets: 0,
    activeUsers: 0,
    totalVolume: 0
  })

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

      {/* Features */}
      <div className="py-16 bg-white">
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
      <div className="py-16 bg-gray-50">
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
      <div className="py-16 bg-white">
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