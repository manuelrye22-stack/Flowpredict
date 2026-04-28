'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { userAPI, walletAPI, betsAPI, ratingsAPI } from '@/lib/api'
import { formatNaira } from '@/lib/constants'

const NAIRA_RATE = 1550

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [balance, setBalance] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [myBets, setMyBets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [activeTab, setActiveTab] = useState<'stats' | 'transactions' | 'ratings' | 'wallet'>('stats')
  const [ratings, setRatings] = useState<any>(null)
  const [ratingStats, setRatingStats] = useState<{ average: string; count: number } | null>(null)
  const [ratingModal, setRatingModal] = useState<{ betId: string; opponentId: string; opponentEmail: string } | null>(null)
  const [givenRatings, setGivenRatings] = useState<string[]>([])
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [showProUpgrade, setShowProUpgrade] = useState(false)
  const [depositTxHash, setDepositTxHash] = useState('')
  const [depositAddress, setDepositAddress] = useState('')
  const [ltcAddress, setLtcAddress] = useState('')
  const [ltcAmount, setLtcAmount] = useState('')
  const [depositSuccess, setDepositSuccess] = useState(false)
  const [gettingFaucet, setGettingFaucet] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawTip, setWithdrawTip] = useState('0')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [copied, setCopied] = useState(false)
  const [withdrawNetwork, setWithdrawNetwork] = useState('USDT')
  const [lastDepositMethod, setLastDepositMethod] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      const [userRes, walletRes, transactionsRes, betsRes, ratingsRes, depositRes] = await Promise.all([
        userAPI.getProfile(),
        walletAPI.getBalance(),
        walletAPI.getTransactions(),
        betsAPI.getMyBets(),
        ratingsAPI.getReceived(),
        walletAPI.getDepositAddress(),
      ])
      setUser(userRes.data)
      setBalance(walletRes.data)
      setLastDepositMethod(walletRes.data.lastDepositMethod || null)
      setTransactions(transactionsRes.data)
      setMyBets(betsRes.data)
      setRatings(ratingsRes.data.ratings)
      setRatingStats({ average: ratingsRes.data.average, count: ratingsRes.data.count })
      
      if (depositRes.data.addresses) {
        setDepositAddress(depositRes.data.addresses.USDT || '')
        setLtcAddress(depositRes.data.addresses.LTC || '')
      } else {
        setDepositAddress(depositRes.data.address)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getTxTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      deposit: '💵 Deposit',
      withdraw: '💸 Withdrawal',
      bet_create: '🎯 Bet Created',
      bet_accept: '🎯 Bet Accepted',
      bet_win: '🏆 Won',
      bet_lose: '❌ Lost',
      bet_refund: '↩️ Refund',
    }
    return labels[type] || type
  }

  const downloadReceipt = async (txId: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:3001/api/transactions/${txId}/receipt`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const receipt = await res.json()
      
      // Create printable HTML
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>FlowPredict Receipt - ${receipt.receiptId}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 400px; margin: 20px auto; padding: 20px; border: 1px solid #ccc; }
    h1 { color: #008751; text-align: center; }
    .detail { margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .value { color: #333; }
    .amount { font-size: 24px; font-weight: bold; ${receipt.amount > 0 ? 'color: green;' : 'color: red;'} }
    .footer { margin-top: 20px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <h1>🧾 FlowPredict Receipt</h1>
  <div class="detail"><span class="label">Receipt ID:</span> <span class="value">${receipt.receiptId}</span></div>
  <div class="detail"><span class="label">Type:</span> <span class="value">${receipt.transactionType}</span></div>
  <div class="detail"><span class="label">Amount:</span> <span class="amount">${receipt.amount > 0 ? '+' : ''}${receipt.amount} USDT</span></div>
  <div class="detail"><span class="label">Status:</span> <span class="value">${receipt.status}</span></div>
  <div class="detail"><span class="label">Date:</span> <span class="value">${new Date(receipt.timestamp).toLocaleString()}</span></div>
  ${receipt.description ? `<div class="detail"><span class="label">Description:</span> <span class="value">${receipt.description}</span></div>` : ''}
  ${receipt.betDetails ? `<hr><div class="detail"><span class="label">Bet Topic:</span> <span class="value">${receipt.betDetails.topic}</span></div><div class="detail"><span class="label">Odds:</span> <span class="value">${receipt.betDetails.odds}x</span></div>` : ''}
  ${receipt.counterparty ? `<div class="detail"><span class="label">${receipt.amount > 0 ? 'Lost to:' : 'Won from:'}</span> <span class="value">${receipt.counterparty.email}</span></div>` : ''}
  <div class="footer">FlowPredict - P2P Crypto Predictions</div>
</body>
</html>`
      
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${txId}.html`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download receipt:', err)
      alert('Failed to download receipt')
    }
  }

  const openRateModal = (bet: any) => {
    const opponent = bet.participants?.find((p: any) => p.userId !== user?._id)
    if (opponent) {
      setRatingModal({ 
        betId: bet._id, 
        opponentId: opponent.userId,
        opponentEmail: opponent.userId?.email || 'Unknown'
      })
    }
  }

  const submitRating = async (stars: number, comment: string) => {
    if (!ratingModal) return
    try {
      await ratingsAPI.rate({
        betId: ratingModal.betId,
        ratedId: ratingModal.opponentId,
        rating: stars,
        comment: comment || undefined
      })
      setGivenRatings([...givenRatings, ratingModal.betId])
      setRatingModal(null)
      alert('Rating submitted! Thanks for your feedback.')
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit rating')
    }
  }

  const handleFaucet = async () => {
    setGettingFaucet(true)
    try {
      const res = await walletAPI.faucet()
      alert(res.data.message)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Faucet failed')
    } finally {
      setGettingFaucet(false)
    }
  }

  const handleDepositLink = async () => {
    if (!depositTxHash) return
    setProcessing(true)
    try {
      await walletAPI.linkDeposit({ txHash: depositTxHash })
      alert('USDT Deposit linked successfully!')
      setShowDeposit(false)
      setDepositTxHash('')
      setDepositSuccess(true)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to link deposit')
    } finally {
      setProcessing(false)
    }
  }

  const handleLtcDeposit = async () => {
    if (!ltcAmount || parseFloat(ltcAmount) <= 0) {
      alert('Please enter amount')
      return
    }
    setProcessing(true)
    try {
      await walletAPI.linkLtcDeposit({ 
        txHash: depositTxHash || 'manual-' + Date.now(),
        amount: parseFloat(ltcAmount)
      })
      alert('Litecoin deposit credited! Check your balance.')
      setShowDeposit(false)
      setDepositTxHash('')
      setLtcAmount('')
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process LTC deposit')
    } finally {
      setProcessing(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (parseFloat(withdrawAmount) > balance?.balance) {
      alert('Insufficient balance')
      return
    }
    const tipAmount = parseFloat(withdrawTip) || 0
    setProcessing(true)
    try {
      await walletAPI.withdraw({ 
        amount: parseFloat(withdrawAmount), 
        address: withdrawAddress,
        tipAmount,
        network: withdrawNetwork
      })
      alert(`Withdrawal request submitted!${tipAmount > 0 ? ' Thanks for the tip! 🙏' : ''}`)
      setShowWithdraw(false)
      setWithdrawAmount('')
      setWithdrawTip('0')
      setWithdrawAddress('')
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Withdrawal failed')
    } finally {
      setProcessing(false)
    }
  }

  const handleSubscribe = async (plan: string) => {
    setSubscribing(true)
    try {
      await userAPI.subscribe({ plan, paymentMethod: 'bank_transfer' })
      alert('Pro subscription activated! You can now create high-stakes bets.')
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Subscription failed')
    } finally {
      setSubscribing(false)
    }
  }

  // Calculate stats
  const totalBets = myBets.length
  const wonBets = myBets.filter((b: any) => b.winnerId === user?._id).length
  const lostBets = myBets.filter((b: any) => b.status === 'RESOLVED' && b.winnerId !== user?._id).length
  const winRate = totalBets > 0 ? Math.round((wonBets / totalBets) * 100) : 0
  
  // Calculate profit/loss
  const wins = myBets
    .filter((b: any) => b.winnerId === user?._id)
    .reduce((sum, b) => sum + (b.stake * b.odds), 0)
  const losses = myBets
    .filter((b: any) => b.status === 'RESOLVED' && b.winnerId !== user?._id)
    .reduce((sum, b) => sum + b.stake, 0)
  const profit = wins - losses

  const exportCSV = () => {
    const headers = ['Topic', 'Category', 'Stake (USDT)', 'Odds', 'Status', 'Result', 'Date']
    const rows = myBets.map((bet: any) => [
      bet.topic,
      bet.category,
      bet.stake,
      bet.odds,
      bet.status,
      bet.winnerId === user?._id ? 'WON' : bet.status === 'RESOLVED' ? 'LOST' : 'PENDING',
      new Date(bet.createdAt).toLocaleDateString()
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bet-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  const usdtBalance = balance?.balance || 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Info */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-2xl font-bold mb-6">Profile</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Wallet Address</p>
              <p className="font-medium text-sm truncate">{user?.walletAddress}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Balance</p>
              <p className="font-medium">{usdtBalance} USDT ({formatNaira(usdtBalance * NAIRA_RATE)})</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pro Status</p>
              <p className={`font-medium ${user?.isPro ? 'text-green-600' : 'text-gray-600'}`}>
                {user?.isPro ? 'Active' : 'Not Active'}
              </p>
              {user?.isPro && user?.proExpiresAt && (
                <p className="text-xs text-gray-500">
                  Expires: {new Date(user.proExpiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-2 rounded-lg font-medium ${
              activeTab === 'stats' 
                ? 'bg-nigeria-green text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            📊 My Stats
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-2 rounded-lg font-medium ${
              activeTab === 'transactions' 
                ? 'bg-nigeria-green text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            💰 Transactions
          </button>
          <button
            onClick={() => setActiveTab('ratings')}
            className={`px-6 py-2 rounded-lg font-medium ${
              activeTab === 'ratings' 
                ? 'bg-nigeria-green text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            ⭐ Ratings
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-6 py-2 rounded-lg font-medium ${
              activeTab === 'wallet' 
                ? 'bg-nigeria-green text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            💳 Wallet
          </button>
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold mb-6">📊 My Statistics</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{totalBets}</p>
                <p className="text-sm text-gray-600">Total Bets</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{wonBets}</p>
                <p className="text-sm text-gray-600">Wins</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-600">{lostBets}</p>
                <p className="text-sm text-gray-600">Losses</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{winRate}%</p>
                <p className="text-sm text-gray-600">Win Rate</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">💰 Profit/Loss</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{wins} USDT</p>
                  <p className="text-sm text-gray-600">Total Wins</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{losses} USDT</p>
                  <p className="text-sm text-gray-600">Total Losses</p>
                </div>
                <div className={`text-center p-4 rounded-lg ${profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profit >= 0 ? '+' : ''}{profit} USDT
                  </p>
                  <p className="text-sm text-gray-600">Net Profit</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">📈 Bet History</h3>
                {myBets.length > 0 && (
                  <button
                    onClick={exportCSV}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    📥 Export CSV
                  </button>
                )}
              </div>
              {myBets.length === 0 ? (
                <p className="text-gray-500">No bets yet</p>
              ) : (
                <div className="space-y-2">
                  {myBets.slice(0, 10).map((bet: any) => (
                    <div key={bet._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{bet.topic}</p>
                        <p className="text-sm text-gray-500">
                          {bet.stake} USDT @ {bet.odds}x | {bet.category}
                        </p>
                      </div>
                      <div className="text-right">
                        {bet.status === 'RESOLVED' ? (
                          <div>
                            <span className={bet.winnerId === user?._id ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                              {bet.winnerId === user?._id ? 'WON' : 'LOST'}
                            </span>
                            {bet.participants?.length > 1 && !givenRatings.includes(bet._id) && (
                              <button
                                onClick={() => openRateModal(bet)}
                                className="block text-xs text-blue-600 hover:underline mt-1"
                              >
                                ⭐ Rate Opponent
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-yellow-600">{bet.status}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold mb-6">💰 Transaction History</h2>
            
            {transactions.length === 0 ? (
              <p className="text-gray-500">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx: any) => (
                  <div key={tx._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{getTxTypeLabel(tx.type)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                      {tx.betTopic && (
                        <p className="text-sm text-gray-600 mt-1">
                          📌 Bet: {tx.betTopic} @ {tx.betOdds}x
                        </p>
                      )}
                      {(tx.opponentEmail && tx.type === 'bet_lose') && (
                        <p className="text-sm text-red-600 mt-1">
                          ❌ Lost to: {tx.opponentEmail}
                        </p>
                      )}
                      {(tx.opponentEmail && tx.type === 'bet_win') && (
                        <p className="text-sm text-green-600 mt-1">
                          🏆 Won from: {tx.opponentEmail}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${
                        tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount} USDT
                      </div>
                      <button
                        onClick={() => downloadReceipt(tx._id)}
                        className="text-xs text-blue-600 hover:underline mt-1"
                      >
                        📥 Download Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ratings Tab */}
        {activeTab === 'ratings' && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold mb-6">⭐ Reputation</h2>
            
            {ratingStats && ratingStats.count > 0 && (
              <div className="flex items-center gap-6 mb-6 p-4 bg-yellow-50 rounded-lg">
                <div className="text-4xl font-bold text-yellow-600">{ratingStats.average}</div>
                <div>
                  <div className="text-yellow-600 text-sm">
                    {'⭐'.repeat(Math.round(Number(ratingStats.average)))}
                  </div>
                  <p className="text-gray-600 text-sm">{ratingStats.count} ratings received</p>
                </div>
              </div>
            )}

            {(!ratings || ratings.length === 0) ? (
              <p className="text-gray-500">No ratings yet. Rate your opponents after bets resolve!</p>
            ) : (
              <div className="space-y-4">
                {ratings.map((r: any) => (
                  <div key={r._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500">{'⭐'.repeat(r.rating)}</span>
                        <span className="text-gray-500 text-sm">from {r.raterEmail}</span>
                      </div>
                      {r.betTopic && (
                        <p className="text-sm text-gray-600 mt-1">Bet: {r.betTopic}</p>
                      )}
                      {r.comment && (
                        <p className="text-sm text-gray-500 mt-1 italic">"{r.comment}"</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> After a bet resolves, you can rate your opponent 
                (1-5 stars). Your reputation score is visible to other users.
              </p>
            </div>
          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-8 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">💳 Wallet</h2>
            
            {/* Balance Display */}
            <div className="bg-gradient-to-r from-nigeria-green to-green-600 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 text-white">
              <p className="text-sm opacity-80">Balance</p>
              <p className="text-3xl sm:text-4xl font-bold">{balance?.balance || 0} USDT</p>
              <p className="text-sm opacity-80 mt-1 sm:mt-2">
                ≈ ₦{((balance?.balance || 0) * 1550).toLocaleString()}
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <button
                onClick={() => setShowDeposit(true)}
                className="py-3 px-4 bg-nigeria-green text-white rounded-lg font-medium hover:bg-green-700 text-sm sm:text-base"
              >
                💵 Deposit
              </button>
              <button
                onClick={() => setShowWithdraw(true)}
                className="py-3 px-4 bg-nigeria-orange text-white rounded-lg font-medium hover:bg-orange-600 text-sm sm:text-base"
              >
                💸 Withdraw
              </button>
            </div>

            {/* Get Free Tokens */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">🎁 Get Free Test Tokens</h3>
              <p className="text-sm text-gray-600 mb-3">
                New users get 50 USDT free to try the platform!
              </p>
              <button
                onClick={handleFaucet}
                disabled={gettingFaucet}
                className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {gettingFaucet ? 'Getting tokens...' : 'Claim 50 USDT (Free)'}
              </button>
            </div>
          </div>
        )}

{/* Deposit Modal */}
        {showDeposit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold mb-4">💵 Deposit</h3>
               
              {/* USDT Section */}
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-green-200 dark:border-gray-600">
                <p className="font-medium text-sm mb-2">USDT (TRC-20):</p>
                <div className="flex">
                  <input
                    type="text"
                    value={depositAddress}
                    readOnly
                    className="flex-1 px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-l-lg text-xs font-mono"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(depositAddress)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="bg-nigeria-green text-white px-3 py-2 rounded-r-lg text-sm"
                  >
                    {copied ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* LTC Section */}
              {ltcAddress && (
                <div className="mb-4 p-4 bg-orange-50 dark:bg-gray-700 rounded-lg border border-orange-200 dark:border-gray-600">
                  <p className="font-medium text-sm mb-2">Litecoin (LTC):</p>
                  <div className="flex">
                    <input
                      type="text"
                      value={ltcAddress}
                      readOnly
                      className="flex-1 px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-l-lg text-xs font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(ltcAddress)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                      className="bg-orange-500 text-white px-3 py-2 rounded-r-lg text-sm"
                    >
                      {copied ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Manual Link */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Link LTC Deposit (paste amount):</label>
                <input
                  type="number"
                  step="0.001"
                  value={ltcAmount}
                  onChange={(e) => setLtcAmount(e.target.value)}
                  className="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg text-sm"
                  placeholder="Amount in LTC"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleLtcDeposit}
                  disabled={!ltcAmount || processing}
                  className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm"
                >
                  {processing ? 'Processing...' : 'Credit LTC'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeposit(false)
                    setDepositTxHash('')
                    setLtcAmount('')
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdraw && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold mb-4">💸 Withdraw USDT</h3>
              
              <p className="text-sm text-gray-600 mb-4">
                Available: {balance?.balance || 0} USDT
              </p>

              <form onSubmit={handleWithdraw}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Amount (USDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Enter amount"
                    required
                  />
                </div>
                
                <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">☕ Tip the Developer</p>
                      <p className="text-xs text-gray-600">Support FlowPredict development</p>
                    </div>
                    <div className="text-purple-600 font-bold">Optional</div>
                  </div>
                  <select 
                    value={withdrawTip}
                    onChange={(e) => setWithdrawTip(e.target.value)}
                    className="w-full mt-2 px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="0">No tip</option>
                    <option value="0.5">₦775 (~0.5 USDT)</option>
                    <option value="1">₦1,550 (~1 USDT)</option>
                    <option value="2">₦3,100 (~2 USDT)</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Withdraw Network</label>
                  <select
                    value={withdrawNetwork}
                    onChange={(e) => setWithdrawNetwork(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="USDT">USDT (TRC-20)</option>
                    <option value="LTC">Litecoin (LTC)</option>
                  </select>
                  {lastDepositMethod && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ You deposited via {lastDepositMethod}. Withdraw only via {lastDepositMethod}.
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    {withdrawNetwork === 'USDT' ? 'USDT TRC-20 Address' : 'Litecoin Address'}
                  </label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder={withdrawNetwork === 'USDT' ? 'Enter your TRC-20 address' : 'Enter your LTC address'}
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={processing}
                    className="flex-1 bg-nigeria-orange text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Request Withdrawal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWithdraw(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
          <h2 className="text-xl font-bold mb-6">Upgrade to Pro</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-2">Free</h3>
              <p className="text-3xl font-bold mb-4">₦0<span className="text-sm font-normal">/month</span></p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm">✓ Create & accept bets up to ₦30,000</li>
                <li className="flex items-center text-sm">✓ Withdraw up to ₦30,000 per bet</li>
                <li className="flex items-center text-sm">✓ Basic dashboard</li>
              </ul>
              <button className="w-full py-2 px-4 bg-gray-200 text-gray-600 rounded-lg font-medium cursor-not-allowed" disabled>
                Current Plan
              </button>
            </div>

            <div className={`border-2 ${user?.isPro ? 'border-green-500' : 'border-nigeria-green'} rounded-xl p-6 relative`}>
              {user?.isPro && (
                <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 text-xs rounded-full">
                  Active
                </span>
              )}
              <h3 className="text-lg font-bold mb-2">Pro</h3>
              <p className="text-3xl font-bold mb-4">₦5,000<span className="text-sm font-normal">/month</span></p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm">✓ Create bets of any amount</li>
                <li className="flex items-center text-sm">✓ Accept any bet</li>
                <li className="flex items-center text-sm">✓ Withdraw any amount</li>
                <li className="flex items-center text-sm">✓ Priority support</li>
                <li className="flex items-center text-sm">✓ No betting limits</li>
              </ul>
              {user?.isPro ? (
                <button className="w-full py-2 px-4 bg-gray-200 text-gray-600 rounded-lg font-medium" disabled>
                  Subscribed
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe('pro')}
                  disabled={subscribing}
                  className="w-full py-2 px-4 bg-nigeria-green text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {subscribing ? 'Processing...' : 'Subscribe via Bank Transfer'}
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Bank Transfer:</strong> Transfer ₦5,000 to Account: FlowPredict, Bank: Providus, No: 9500000000. 
              Use your email as payment reference. We'll activate within 24hrs.
            </p>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">⭐ Rate Your Opponent</h3>
            <p className="text-sm text-gray-600 mb-4">
              How was your experience betting with <strong>{ratingModal.opponentEmail}</strong>?
            </p>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => submitRating(star, '')}
                  className="text-3xl hover:scale-110 transition-transform"
                >
                  ⭐
                </button>
              ))}
            </div>
            <textarea
              placeholder="Optional comment..."
              className="w-full p-3 border rounded-lg mb-4 h-20 resize-none"
              id="rating-comment"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const comment = (document.getElementById('rating-comment') as HTMLTextAreaElement)?.value
                  submitRating(5, comment || '')
                }}
                className="flex-1 bg-nigeria-green text-white py-2 rounded-lg hover:bg-green-700"
              >
                Submit (5⭐)
              </button>
              <button
                onClick={() => setRatingModal(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}