import express, { Request, Response } from 'express'
import Transaction from '../models/Transaction.js'

const authenticate = (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' })
  }
  try {
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'flowpredict_secret_key_2026')
    req.body.userId = decoded.userId
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

const router = express.Router()

// Get user's transaction history
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .lean()

    const formatted = transactions.map(tx => ({
      _id: tx._id,
      type: tx.type,
      amount: tx.amount,
      status: tx.status,
      txHash: tx.txHash,
      betId: tx.betId,
      description: tx.description,
      betTopic: tx.betTopic,
      betOdds: tx.betOdds,
      opponentId: tx.opponentId,
      opponentEmail: tx.opponentEmail,
      createdAt: tx.createdAt,
    }))

    res.json(formatted)
  } catch (error) {
    console.error('Get transactions error:', error)
    res.status(500).json({ message: 'Failed to fetch transactions' })
  }
})

// Get single transaction receipt
router.get('/:id/receipt', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId
    const tx = await Transaction.findOne({ _id: req.params.id, userId })

    if (!tx) {
      return res.status(404).json({ message: 'Transaction not found' })
    }

    // Format receipt data
    const receipt = {
      receiptId: tx._id,
      transactionType: tx.type,
      amount: tx.amount,
      status: tx.status,
      timestamp: tx.createdAt,
      description: tx.description,
      // Bet details
      betDetails: tx.betId ? {
        betId: tx.betId,
        topic: tx.betTopic,
        odds: tx.betOdds,
      } : null,
      // Counterparty details
      counterparty: tx.opponentEmail ? {
        name: tx.opponentEmail.split('@')[0],
        email: tx.opponentEmail,
      } : null,
      // Payment details
      paymentInfo: tx.txHash ? {
        txHash: tx.txHash,
      } : null,
    }

    res.json(receipt)
  } catch (error) {
    console.error('Get receipt error:', error)
    res.status(500).json({ message: 'Failed to fetch receipt' })
  }
})

export default router