import dotenv from 'dotenv'
dotenv.config()

import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Transaction from '../models/Transaction.js'
import Withdrawal from '../models/Withdrawal.js'
import Deposit from '../models/Deposit.js'
import { sendLTC, isLTCWithdrawConfigured } from '../lib/ltc.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'flowpredict_secret_key_2026'

const PLATFORM_WALLET = process.env.PLATFORM_WALLET || 'TDPxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
const LTC_WALLET = process.env.LTC_WALLET || '' // Your Litecoin address

const EXCHANGE_RATES = {
  USDT: 1550,
  LTC: 185000, // 1 LTC = ₦185,000
  BTC: 155000000,
}

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

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.body.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ balance: user.balance, lastDepositMethod: user.lastDepositMethod })
  } catch (error) {
    res.status(500).json({ message: 'Failed to get balance' })
  }
})

// GET PLATFORM DEPOSIT ADDRESS
router.get('/deposit-address', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.body.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ 
      addresses: {
        USDT: PLATFORM_WALLET,
        LTC: LTC_WALLET || null
      },
      rates: EXCHANGE_RATES,
      note: 'Send crypto to the address above. Deposits are auto-detected within 30 seconds.',
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to get deposit address' })
  }
})

// LINK DEPOSIT MANUALLY (backup if auto-detect fails)
router.post('/deposit/link', authenticate, async (req: Request, res: Response) => {
  try {
    const { txHash } = req.body

    if (!txHash) {
      return res.status(400).json({ message: 'Transaction hash required' })
    }

    const user = await User.findById(req.body.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const existing = await Deposit.findOne({ txHash, status: 'credited' })
    if (existing) {
      return res.status(400).json({ message: 'Deposit already credited' })
    }

    const deposit = await Deposit.findOne({ txHash })
    if (deposit && deposit.status === 'pending') {
      user.balance += deposit.amount
      await user.save()

      deposit.status = 'credited'
      deposit.userId = user._id
      deposit.creditedAt = new Date()
      await deposit.save()

      await Transaction.create({
        userId: user._id,
        type: 'deposit',
        amount: deposit.amount,
        status: 'completed',
        txHash: deposit.txHash,
        description: `Manual link: ${deposit.amount} USDT`,
      })

      res.json({ 
        message: 'Deposit credited successfully', 
        balance: user.balance,
        amount: deposit.amount,
      })
    } else {
      return res.status(404).json({ message: 'Deposit not found. Make sure you sent USDT to the platform address first.' })
    }
  } catch (error) {
    console.error('Deposit link error:', error)
    res.status(500).json({ message: 'Failed to link deposit' })
  }
})

// LINK LITECOIN DEPOSIT MANUALLY
router.post('/deposit/ltc', authenticate, async (req: Request, res: Response) => {
  try {
    const { txHash, amount } = req.body

    if (!txHash || !amount) {
      return res.status(400).json({ message: 'Transaction hash and amount required' })
    }

    const user = await User.findById(req.body.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const existing = await Deposit.findOne({ txHash, status: 'credited' })
    if (existing) {
      return res.status(400).json({ message: 'Deposit already credited' })
    }

    if (!LTC_WALLET) {
      return res.status(500).json({ message: 'Litecoin deposits not configured' })
    }

    const nairaAmount = amount * EXCHANGE_RATES.LTC
    const usdtEquivalent = nairaAmount / EXCHANGE_RATES.USDT

    await Deposit.create({
      userId: user._id,
      amount: usdtEquivalent,
      txHash,
      currency: 'LTC',
      status: 'credited',
      creditedAt: new Date()
    })

    user.balance += usdtEquivalent
    user.lastDepositMethod = 'LTC'
    await user.save()

    await Transaction.create({
      userId: user._id,
      type: 'deposit',
      amount: usdtEquivalent,
      status: 'completed',
      txHash,
      description: `LTC deposit: ${amount} LTC (₦${nairaAmount.toLocaleString()})`,
    })

    res.json({ 
      message: 'Litecoin deposit credited!', 
      balance: user.balance,
      amount: usdtEquivalent,
      nairaAmount,
    })
  } catch (error) {
    console.error('LTC deposit error:', error)
    res.status(500).json({ message: 'Failed to process LTC deposit' })
  }
})

router.post('/deposit', authenticate, async (req: Request, res: Response) => {
  try {
    const { amount } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' })
    }

    const user = await User.findById(req.body.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.balance += amount
    user.lastDepositMethod = 'USDT'
    await user.save()

    await Transaction.create({
      userId: user._id,
      type: 'deposit',
      amount,
      status: 'completed',
      description: `Deposit of ${amount} USDT`,
    })

    res.json({ 
      message: 'Deposit successful', 
      balance: user.balance 
    })
  } catch (error) {
    console.error('Deposit error:', error)
    res.status(500).json({ message: 'Deposit failed' })
  }
})

router.post('/faucet', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.body.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Give 50 USDT test tokens (once per user)
    const FAUCET_AMOUNT = 50
    
    user.balance += FAUCET_AMOUNT
    await user.save()

    await Transaction.create({
      userId: user._id,
      type: 'deposit',
      amount: FAUCET_AMOUNT,
      status: 'completed',
      description: `Faucet - Free test tokens`,
    })

    res.json({ 
      message: 'You received 50 USDT test tokens!',
      balance: user.balance 
    })
  } catch (error) {
    console.error('Faucet error:', error)
    res.status(500).json({ message: 'Faucet failed' })
  }
})

router.post('/withdraw', authenticate, async (req: Request, res: Response) => {
  try {
    const { amount, address, tipAmount = 0, network = 'USDT' } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' })
    }

    const user = await User.findById(req.body.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Enforce withdrawal network matches last deposit
    if (user.lastDepositMethod && user.lastDepositMethod !== network) {
      return res.status(400).json({ 
        message: `You deposited via ${user.lastDepositMethod}. Please withdraw using ${user.lastDepositMethod}.` 
      })
    }

    const nairaValue = (amount + tipAmount) * 1550
    if (nairaValue >= 30000 && !user.isPro) {
      return res.status(400).json({ 
        message: 'Pro subscription required for withdrawals over ₦30,000. Please upgrade to Pro.' 
      })
    }

    // Check balance (include tip in deduction)
    const totalDeduction = amount + tipAmount
    if (user.balance < totalDeduction) {
      return res.status(400).json({ message: 'Insufficient balance' })
    }

    // Create withdrawal request (pending approval)
    const withdrawal = await Withdrawal.create({
      userId: user._id,
      amount,
      address,
      tipAmount, // Platform tip (optional)
      network: network as 'USDT' | 'LTC',
      status: 'pending',
    })

    // Create pending transaction record
    await Transaction.create({
      userId: user._id,
      type: 'withdraw',
      amount: -amount,
      status: 'pending',
      description: `Withdrawal request: ${amount} USDT to ${address.substring(0, 10)}...`,
    })

    res.json({ 
      message: 'Withdrawal request submitted. Pending admin approval.',
      withdrawalId: withdrawal._id,
      amount,
    })
  } catch (error) {
    console.error('Withdraw error:', error)
    res.status(500).json({ message: 'Withdrawal failed' })
  }
})

// GET TRANSACTION HISTORY
router.get('/transactions', authenticate, async (req: Request, res: Response) => {
  try {
    const transactions = await Transaction.find({ userId: req.body.userId })
      .sort({ createdAt: -1 })
      .limit(50)
    
    res.json(transactions)
  } catch (error) {
    res.status(500).json({ message: 'Failed to get transactions' })
  }
})

// ADMIN: Get all pending withdrawals
router.get('/withdrawals/pending', authenticate, async (req: Request, res: Response) => {
  try {
    const withdrawals = await Withdrawal.find({ status: 'pending' })
      .populate('userId', 'email')
      .sort({ requestedAt: -1 })
    
    res.json(withdrawals)
  } catch (error) {
    res.status(500).json({ message: 'Failed to get withdrawals' })
  }
})

// ADMIN: Get platform wallet balances
router.get('/admin/balance', authenticate, async (req: Request, res: Response) => {
  try {
    const { getUSDTBalance } = await import('../services/withdrawalProcessor.js')
    const usdtBalance = await getUSDTBalance()
    res.json({ usdtBalance })
  } catch (error) {
    res.status(500).json({ message: 'Failed to get balance' })
  }
})

// ADMIN: Approve or reject withdrawal
router.post('/withdrawals/:id/process', authenticate, async (req: Request, res: Response) => {
  try {
    const { action, txHash, notes } = req.body // action: 'approve' or 'reject'
    const adminId = req.body.userId
    
    const withdrawal = await Withdrawal.findById(req.params.id)
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' })
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal already processed' })
    }

    const user = await User.findById(withdrawal.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (action === 'approve') {
      // Deduct balance now
      if (user.balance < withdrawal.amount) {
        return res.status(400).json({ message: 'Insufficient user balance' })
      }
      
      user.balance -= withdrawal.amount
      await user.save()

      // Update withdrawal (manual tx hash still required for LTC)
      withdrawal.status = 'approved'
      withdrawal.txHash = txHash || ''
      withdrawal.processedAt = new Date()
      withdrawal.processedBy = adminId
      if (withdrawal.network === 'LTC') {
        const ltcAmount = withdrawal.amount / (EXCHANGE_RATES.USDT / EXCHANGE_RATES.LTC)
        withdrawal.notes = notes || `Manual send needed: ${ltcAmount} LTC to ${withdrawal.address}`
      } else {
        withdrawal.notes = notes || 'Approved'
      }
      await withdrawal.save()

      // Update transaction status
      await Transaction.findOneAndUpdate(
        { userId: withdrawal.userId, type: 'withdraw', status: 'pending' },
        { status: 'completed' }
      )

      res.json({ message: 'Withdrawal approved', withdrawal })
    } else if (action === 'reject') {
      // Reject - don't deduct balance, just mark as rejected
      withdrawal.status = 'rejected'
      withdrawal.processedAt = new Date()
      withdrawal.processedBy = adminId
      withdrawal.notes = notes || 'Rejected by admin'
      await withdrawal.save()

      // Update transaction status
      await Transaction.findOneAndUpdate(
        { userId: withdrawal.userId, type: 'withdraw', status: 'pending' },
        { status: 'failed' }
      )

      res.json({ message: 'Withdrawal rejected', withdrawal })
    } else {
      res.status(400).json({ message: 'Invalid action' })
    }
  } catch (error) {
    console.error('Process withdrawal error:', error)
    res.status(500).json({ message: 'Failed to process withdrawal' })
  }
})

export default router