import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Bet from '../models/Bet.js'
import Transaction from '../models/Transaction.js'
import Withdrawal from '../models/Withdrawal.js'
import Deposit from '../models/Deposit.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'flowpredict_secret_key_2026'

const authenticate = (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    req.body.userId = decoded.userId
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

const requireAdmin = async (req: Request, res: Response, next: Function) => {
  const user = await User.findById(req.body.userId)
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }
  // Check role-based access
  if (!['admin', 'superadmin'].includes(user.role || 'user')) {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}

// PLATFORM STATS
router.get('/stats', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalBets,
      totalVolume,
      resolvedBets,
      pendingWithdrawals,
      totalDeposits,
      proUsers,
      bannedUsers
    ] = await Promise.all([
      User.countDocuments(),
      Bet.countDocuments(),
      Transaction.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Bet.countDocuments({ status: 'RESOLVED' }),
      Withdrawal.countDocuments({ status: 'pending' }),
      Deposit.countDocuments({ status: 'credited' }),
      User.countDocuments({ isPro: true }),
      User.countDocuments({ isBanned: true })
    ])

    const volume = totalVolume[0]?.total || 0

    res.json({
      totalUsers,
      totalBets,
      totalVolume: volume,
      resolvedBets,
      pendingWithdrawals,
      totalDeposits,
      proUsers,
      bannedUsers,
      activeBets: await Bet.countDocuments({ status: { $in: ['OPEN', 'MATCHED'] } })
    })
  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({ message: 'Failed to get stats' })
  }
})

// GET ALL USERS
router.get('/users', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { search, filter, page = 1, limit = 50 } = req.query
    
    const query: any = {}
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { walletAddress: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (filter === 'pro') query.isPro = true
    if (filter === 'banned') query.isBanned = true
    if (filter === 'flagged') query.flagged = true
    if (filter === 'active') query.isBanned = false
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
    
    const total = await User.countDocuments(query)
    
    res.json({ users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ message: 'Failed to get users' })
  }
})

// GET SINGLE USER
router.get('/users/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    const [transactions, bets, withdrawals] = await Promise.all([
      Transaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20),
      Bet.find({ creatorId: user._id }).sort({ createdAt: -1 }).limit(10),
      Withdrawal.find({ userId: user._id }).sort({ requestedAt: -1 }).limit(10)
    ])
    
    res.json({ user, transactions, bets, withdrawals })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Failed to get user' })
  }
})

// UPDATE USER
router.put('/users/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { balance, isPro, proExpiresAt, walletAddress, role } = req.body
    
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    if (balance !== undefined) user.balance = balance
    if (isPro !== undefined) user.isPro = isPro
    if (proExpiresAt) user.proExpiresAt = new Date(proExpiresAt)
    if (walletAddress) user.walletAddress = walletAddress
    if (role) user.role = role
    
    await user.save()
    
    res.json({ message: 'User updated', user })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ message: 'Failed to update user' })
  }
})

// BAN/UNBAN USER
router.post('/users/:id/ban', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { ban, reason } = req.body
    
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    user.isBanned = ban
    user.banReason = ban ? reason : ''
    await user.save()
    
    res.json({ 
      message: ban ? 'User banned' : 'User unbanned', 
      user: { _id: user._id, email: user.email, isBanned: user.isBanned, banReason: user.banReason }
    })
  } catch (error) {
    console.error('Ban user error:', error)
    res.status(500).json({ message: 'Failed to ban user' })
  }
})

// FLAG USER
router.post('/users/:id/flag', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { flag, reason } = req.body
    
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    user.flagged = flag
    user.flagReason = flag ? reason : ''
    await user.save()
    
    res.json({ 
      message: flag ? 'User flagged' : 'Flag cleared', 
      user: { _id: user._id, email: user.email, flagged: user.flagged, flagReason: user.flagReason }
    })
  } catch (error) {
    console.error('Flag user error:', error)
    res.status(500).json({ message: 'Failed to flag user' })
  }
})

// GET ALL BETS
router.get('/bets', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, category, page = 1, limit = 50 } = req.query
    
    const query: any = {}
    if (status) query.status = status
    if (category) query.category = category
    
    const bets = await Bet.find(query)
      .populate('creatorId', 'email')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
    
    const total = await Bet.countDocuments(query)
    
    res.json({ bets, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
  } catch (error) {
    console.error('Get bets error:', error)
    res.status(500).json({ message: 'Failed to get bets' })
  }
})

// FORCE CLOSE BET
router.put('/bets/:id/close', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const bet = await Bet.findById(req.params.id)
    if (!bet) {
      return res.status(404).json({ message: 'Bet not found' })
    }
    
    bet.status = 'CLOSED'
    bet.resolution = 'Forced close by admin'
    await bet.save()
    
    res.json({ message: 'Bet closed', bet })
  } catch (error) {
    console.error('Close bet error:', error)
    res.status(500).json({ message: 'Failed to close bet' })
  }
})

// DELETE BET
router.delete('/bets/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { refund } = req.query
    
    const bet = await Bet.findById(req.params.id)
    if (!bet) {
      return res.status(404).json({ message: 'Bet not found' })
    }
    
    // Optionally refund creator
    if (refund === 'true') {
      const creator = await User.findById(bet.creatorId)
      if (creator) {
        creator.balance += bet.stake
        await creator.save()
        
        await Transaction.create({
          userId: creator._id,
          type: 'bet_refund',
          amount: bet.stake,
          betId: bet._id,
          description: `Admin deleted bet refund: ${bet.topic}`
        })
      }
    }
    
    await Bet.findByIdAndDelete(req.params.id)
    
    res.json({ message: 'Bet deleted', refunded: refund === 'true' })
  } catch (error) {
    console.error('Delete bet error:', error)
    res.status(500).json({ message: 'Failed to delete bet' })
  }
})

// MANUAL DEPOSIT
router.post('/deposits/manual', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId, amount, note } = req.body
    
    if (!userId || !amount) {
      return res.status(400).json({ message: 'userId and amount required' })
    }
    
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    user.balance += Number(amount)
    await user.save()
    
    await Deposit.create({
      userId: user._id,
      amount: Number(amount),
      txHash: 'manual:' + Date.now(),
      currency: 'USDT',
      status: 'credited',
      creditedAt: new Date()
    })
    
    await Transaction.create({
      userId: user._id,
      type: 'deposit',
      amount: Number(amount),
      status: 'completed',
      description: note || 'Manual deposit by admin'
    })
    
    res.json({ message: 'Deposit credited', balance: user.balance })
  } catch (error) {
    console.error('Manual deposit error:', error)
    res.status(500).json({ message: 'Failed to credit deposit' })
  }
})

// FIX SUPERADMIN
router.get('/fix-superadmin', async (req: Request, res: Response) => {
  try {
    const user = await User.findOneAndUpdate(
      { email: 'manuelrye22@gmail.com' },
      { role: 'superadmin' },
      { new: true }
    )
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json({ message: 'Fixed!', role: user.role })
  } catch (error) {
    res.status(500).json({ message: 'Failed' })
  }
})

export default router