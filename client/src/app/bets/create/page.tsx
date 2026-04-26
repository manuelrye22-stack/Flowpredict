'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { betsAPI, walletAPI, userAPI, verificationAPI } from '@/lib/api'

const categories = ['Sports', 'Crypto', 'Politics', 'Entertainment', 'Weather', 'Business', 'Custom']

export default function CreateBet() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    topic: '',
    category: 'Sports',
    odds: 2.0,
    stake: 10,
    direction: 'YES' as 'YES' | 'NO',
    expiresAt: '',
  })
  const [verificationType, setVerificationType] = useState<'manual' | 'consensus' | 'api'>('manual')
  const [verificationValue, setVerificationValue] = useState('')
  const [balance, setBalance] = useState<number>(0)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const userData = localStorage.getItem('user')
    if (userData) {
      const parsed = JSON.parse(userData)
      setUser(parsed)
      if (!parsed.isPro) {
        setFormData((prev) => ({ ...prev, stake: Math.min(prev.stake, 600) }))
      }
    }

    fetchBalance()
  }, [router])

  const fetchBalance = async () => {
    try {
      const res = await walletAPI.getBalance()
      setBalance(res.data.balance)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

const nairaValue = formData.stake * 1550
    if (nairaValue >= 30000 && !user?.isPro) {
      setError('Upgrade to Pro for bets over ₦30,000. Visit your profile to upgrade.')
      return
    }

    if (formData.stake > balance) {
      setError('Insufficient balance. Please deposit USDT first.')
      return
    }

    setLoading(true)
    try {
      const res = await betsAPI.create(formData)
      
      // Set verification method
      if (res.data?._id) {
        await verificationAPI.setVerification(res.data._id, {
          sourceType: verificationType,
          sourceValue: verificationType === 'api' ? verificationValue : undefined,
        })
      }
      
      alert('Bet created successfully!')
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create bet')
    } finally {
      setLoading(false)
    }
  }

  const nairaValue = formData.stake * 5000
  const requiresPro = nairaValue >= 30000 && !user?.isPro

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6">Create New Bet</h1>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Balance:</strong> {balance} USDT (~₦{(balance * 5000).toLocaleString()})
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What do you want to bet on?
              </label>
              <input
                type="text"
                required
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nigeria-green focus:border-transparent"
                placeholder="e.g., Man City go beat Arsenal this weekend"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="flex gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      formData.category === cat
                        ? 'bg-nigeria-green text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Verification Method */}
            <div className="border-t pt-6 mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 How will the outcome be verified?
              </label>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setVerificationType('manual')}
                  className={`p-3 rounded-lg border text-sm ${
                    verificationType === 'manual' 
                      ? 'border-nigeria-green bg-green-50 text-green-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">👤 Manual</div>
                  <div className="text-xs text-gray-500">Admin verifies</div>
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationType('consensus')}
                  className={`p-3 rounded-lg border text-sm ${
                    verificationType === 'consensus' 
                      ? 'border-nigeria-green bg-green-50 text-green-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">🤝 Consensus</div>
                  <div className="text-xs text-gray-500">Both agree</div>
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationType('api')}
                  className={`p-3 rounded-lg border text-sm ${
                    verificationType === 'api' 
                      ? 'border-nigeria-green bg-green-50 text-green-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">🔗 API</div>
                  <div className="text-xs text-gray-500">Auto-verify</div>
                </button>
              </div>
              {verificationType === 'api' && (
                <input
                  type="text"
                  placeholder="Example: btc > 50000 or manutd wins"
                  value={verificationValue}
                  onChange={(e) => setVerificationValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nigeria-green"
                />
              )}
              <p className="text-xs text-gray-500 mt-2">
                {verificationType === 'manual' && 'An admin will review evidence and determine the winner.'}
                {verificationType === 'consensus' && 'Both parties must agree on the outcome to resolve.'}
                {verificationType === 'api' && 'For crypto/sports: system will check external data to determine winner.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Odds (multiplier)
                </label>
                <input
                  type="number"
                  step="1"
                  min="2"
                  max="10"
                  required
                  value={formData.odds}
                  onChange={(e) => setFormData({ ...formData, odds: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nigeria-green focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.odds}x odds = {formData.odds} people needed. Winner takes whole pool!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stake (USDT)
                </label>
                <input
                  type="number"
                  min="1"
                  max={user?.isPro ? 10000 : 600}
                  required
                  value={formData.stake}
                  onChange={(e) => setFormData({ ...formData, stake: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nigeria-green focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ~₦{(formData.stake * 1550).toLocaleString()} | If win: {formData.stake * formData.odds} USDT
                </p>
              </div>
            </div>

            {requiresPro && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This bet is over ₦30,000. Pro subscription required.
                  <a href="/profile" className="underline ml-1">Upgrade to Pro</a>
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Prediction
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, direction: 'YES' })}
                  className={`flex-1 py-3 rounded-lg font-medium ${
                    formData.direction === 'YES'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  YES (Your prediction will happen)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, direction: 'NO' })}
                  className={`flex-1 py-3 rounded-lg font-medium ${
                    formData.direction === 'NO'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  NO (Your prediction won't happen)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Expiry Date & Time (optional)
              </label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nigeria-green focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                If set, bet will auto-expire at this date/time. If no one joins, you get refunded.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>Summary:</strong> You create a &quot;{formData.direction}&quot; bet on &quot;{formData.topic || '...'}&quot; 
                with {formData.stake} USDT at {formData.odds}x odds.
                If you win, you receive <span className="text-green-600 font-bold">{formData.stake * formData.odds} USDT</span> (your stake + profit).
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || requiresPro}
              className="w-full bg-nigeria-green text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : requiresPro ? 'Pro Required' : 'Create Bet'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}