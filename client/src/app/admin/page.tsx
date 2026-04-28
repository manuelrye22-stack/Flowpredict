'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { betsAPI, verificationAPI, walletAPI, adminAPI } from '@/lib/api'

export default function AdminPanel() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'bets' | 'withdrawals' | 'deposits'>('dashboard')
  
  // Dashboard state
  const [stats, setStats] = useState<any>(null)
  
  // Users state
  const [users, setUsers] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  
  // Bets state
  const [bets, setBets] = useState<any[]>([])
  const [betFilter, setBetFilter] = useState('')
  const [betSearch, setBetSearch] = useState('')
  
  // Withdrawals state
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [platformBalance, setPlatformBalance] = useState(0)
  
  // Deposits state
  const [depositUserId, setDepositUserId] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [depositNote, setDepositNote] = useState('')

  const [loading, setLoading] = useState(true)

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

    loadDashboard()
  }, [router])

  const loadDashboard = async () => {
    try {
      const res = await adminAPI.getStats()
      setStats(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const res = await adminAPI.getUsers({ search: userSearch, filter: userFilter })
      setUsers(res.data.users)
    } catch (err) {
      console.error(err)
    }
  }

  const loadBets = async () => {
    try {
      const res = await adminAPI.getBets({ status: betFilter as any })
      setBets(res.data.bets)
    } catch (err) {
      console.error(err)
    }
  }

  const loadWithdrawals = async () => {
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

  const handleBanUser = async (userId: string, ban: boolean) => {
    const reasonInput = ban ? prompt('Reason for banning:') : null
    const reason = reasonInput || undefined
    if (ban && !reason) return
    
    if (!confirm(ban ? `Ban this user?` : 'Unban this user?')) return
    
    try {
      await adminAPI.banUser(userId, ban, reason)
      alert(ban ? 'User banned' : 'User unbanned')
      loadUsers()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed')
    }
  }

  const handleFlagUser = async (userId: string, flag: boolean) => {
    const reasonInput = flag ? prompt('Reason for flagging:') : null
    const reason = reasonInput || undefined
    if (flag && !reason) return
    
    try {
      await adminAPI.flagUser(userId, flag, reason)
      alert(flag ? 'User flagged' : 'Flag cleared')
      loadUsers()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed')
    }
  }

  const handleSetPro = async (userId: string, isPro: boolean) => {
    try {
      await adminAPI.updateUser(userId, { isPro })
      alert(isPro ? 'User upgraded to Pro' : 'Pro removed')
      loadUsers()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed')
    }
  }

  const handleUpdateBalance = async (userId: string) => {
    const newBalance = prompt('Enter new balance:')
    if (!newBalance) return
    
    try {
      await adminAPI.updateUser(userId, { balance: parseFloat(newBalance) })
      alert('Balance updated')
      loadUsers()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed')
    }
  }

  const handleCloseBet = async (betId: string) => {
    if (!confirm('Close this bet?')) return
    
    try {
      await adminAPI.closeBet(betId)
      alert('Bet closed')
      loadBets()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed')
    }
  }

  const handleDeleteBet = async (betId: string, refund: boolean) => {
    if (!confirm(`Delete this bet${refund ? ' (with refund)' : ''}?`)) return
    
    try {
      await adminAPI.deleteBet(betId, refund)
      alert('Bet deleted')
      loadBets()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed')
    }
  }

  const handleProcessWithdrawal = async (id: string, action: string, txHash: string) => {
    if (!confirm(`Are you sure you want to ${action} this withdrawal?`)) return

    try {
      await walletAPI.processWithdrawal(id, { action, txHash })
      alert(`Withdrawal ${action}ed!`)
      loadWithdrawals()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed')
    }
  }

  const handleManualDeposit = async () => {
    if (!depositUserId || !depositAmount) {
      alert('User ID and amount required')
      return
    }

    try {
      await adminAPI.manualDeposit({
        userId: depositUserId,
        amount: parseFloat(depositAmount),
        note: depositNote
      })
      alert('Deposit credited!')
      setDepositUserId('')
      setDepositAmount('')
      setDepositNote('')
      loadDashboard()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">FlowPredict Admin</h1>
            <p className="text-sm text-gray-300">Full platform control</p>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-white hover:underline">Dashboard</Link>
            <a href="/" className="text-white hover:underline">Home</a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { key: 'dashboard', label: '📊 Dashboard' },
            { key: 'users', label: '👥 Users' },
            { key: 'bets', label: '🎯 Bets' },
            { key: 'withdrawals', label: '💰 Withdrawals' },
            { key: 'deposits', label: '💳 Deposits' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as any)
                if (tab.key === 'dashboard') loadDashboard()
                if (tab.key === 'users') loadUsers()
                if (tab.key === 'bets') loadBets()
                if (tab.key === 'withdrawals') loadWithdrawals()
              }}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                activeTab === tab.key 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <p className="text-sm text-gray-500">Total Bets</p>
              <p className="text-3xl font-bold">{stats.totalBets}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <p className="text-sm text-gray-500">Total Volume</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalVolume?.toFixed(2) || 0} USDT</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <p className="text-sm text-gray-500">Pro Users</p>
              <p className="text-3xl font-bold text-purple-600">{stats.proUsers}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <p className="text-sm text-gray-500">Active Bets</p>
              <p className="text-3xl font-bold">{stats.activeBets}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <p className="text-sm text-gray-500">Pending Withdrawals</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingWithdrawals}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <p className="text-sm text-gray-500">Total Deposits</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalDeposits}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <p className="text-sm text-gray-500">Banned Users</p>
              <p className="text-3xl font-bold text-red-600">{stats.bannedUsers}</p>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Search email or wallet..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              />
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">All</option>
                <option value="pro">Pro</option>
                <option value="banned">Banned</option>
                <option value="flagged">Flagged</option>
                <option value="active">Active</option>
              </select>
              <button
                onClick={loadUsers}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Search
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Balance</th>
                    <th className="px-4 py-2 text-left">Pro</th>
                    <th className="px-4 py-2 text-left">Created</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u._id} className="border-t">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {u.email}
                          {u.isBanned && <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">BANNED</span>}
                          {u.flagged && <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded">FLAGGED</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2">{u.balance?.toFixed(2)} USDT</td>
                      <td className="px-4 py-2">
                        {u.isPro ? '✓ Pro' : 'Free'}
                      </td>
                      <td className="px-4 py-2 text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1 flex-wrap">
                          <button
                            onClick={() => handleUpdateBalance(u._id)}
                            className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
                          >
                            Balance
                          </button>
                          <button
                            onClick={() => handleSetPro(u._id, !u.isPro)}
                            className="px-2 py-1 bg-purple-500 text-white text-xs rounded"
                          >
                            {u.isPro ? 'Remove Pro' : 'Make Pro'}
                          </button>
                          <button
                            onClick={() => handleFlagUser(u._id, !u.flagged)}
                            className={`px-2 py-1 text-white text-xs rounded ${u.flagged ? 'bg-gray-500' : 'bg-yellow-500'}`}
                          >
                            {u.flagged ? 'Unflag' : 'Flag'}
                          </button>
                          <button
                            onClick={() => handleBanUser(u._id, !u.isBanned)}
                            className={`px-2 py-1 text-white text-xs rounded ${u.isBanned ? 'bg-green-500' : 'bg-red-500'}`}
                          >
                            {u.isBanned ? 'Unban' : 'Ban'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BETS TAB */}
        {activeTab === 'bets' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <select
                value={betFilter}
                onChange={(e) => setBetFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">All</option>
                <option value="OPEN">Open</option>
                <option value="MATCHED">Matched</option>
                <option value="RESOLVED">Resolved</option>
                <option value="DISPUTED">Disputed</option>
                <option value="EXPIRED">Expired</option>
                <option value="CLOSED">Closed</option>
              </select>
              <button
                onClick={loadBets}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Filter
              </button>
            </div>

            <div className="space-y-3">
              {bets.map((bet: any) => (
                <div key={bet._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{bet.topic}</h3>
                      <p className="text-sm text-gray-500">
                        {bet.category} | Stake: {bet.stake} USDT | Odds: {bet.odds}x
                      </p>
                      <p className="text-sm">
                        Status: <span className="font-medium">{bet.status}</span> | 
                        Participants: {bet.participants?.length || 0}/{bet.requiredParticipants}
                      </p>
                      <p className="text-xs text-gray-400">
                        By: {bet.creatorId?.email || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleCloseBet(bet._id)}
                        className="px-3 py-1 bg-orange-500 text-white text-sm rounded"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => handleDeleteBet(bet._id, false)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handleDeleteBet(bet._id, true)}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded"
                      >
                        Del+Refund
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WITHDRAWALS TAB */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div>
                <p className="text-sm text-gray-500">Platform Balance</p>
                <p className="text-2xl font-bold text-green-600">{platformBalance.toFixed(2)} USDT</p>
              </div>
              <button
                onClick={loadWithdrawals}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-3">
              {withdrawals.map((w: any) => (
                <div key={w._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg">{w.amount} USDT</p>
                        <span className={`px-2 py-1 rounded text-xs ${w.network === 'LTC' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                          {w.network || 'USDT'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">To: {w.address?.substring(0, 20)}...</p>
                      <p className="text-xs text-gray-400">
                        User: {w.userId?.email || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {w.network === 'LTC' ? (
                        <button
                          onClick={() => handleProcessWithdrawal(w._id, 'approve', 'auto')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
                        >
                          Auto-Send
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const tx = prompt('TX Hash:')
                            if (tx) handleProcessWithdrawal(w._id, 'approve', tx)
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleProcessWithdrawal(w._id, 'reject', '')}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DEPOSITS TAB */}
        {activeTab === 'deposits' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-bold mb-4">Manual Deposit</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="User ID"
                  value={depositUserId}
                  onChange={(e) => setDepositUserId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  type="number"
                  placeholder="Amount (USDT)"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  type="text"
                  placeholder="Note (optional)"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <button
                  onClick={handleManualDeposit}
                  className="w-full py-2 bg-green-600 text-white rounded-lg"
                >
                  Credit Deposit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}