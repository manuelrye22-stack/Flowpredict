import express, { Request, Response } from 'express'
import Rating from '../models/Rating.js'
import Bet from '../models/Bet.js'

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

// Rate an opponent after bet resolves
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { betId, ratedId, rating, comment } = req.body
    const raterId = req.body.userId

    // Verify bet is resolved
    const bet = await Bet.findById(betId)
    if (!bet || bet.status !== 'RESOLVED') {
      return res.status(400).json({ message: 'Bet must be resolved to rate' })
    }

    // Verify user was a participant
    const isParticipant = bet.participants.some((p: any) => 
      p.userId.toString() === raterId || p.userId.toString() === ratedId
    )
    if (!isParticipant) {
      return res.status(400).json({ message: 'You must be a participant to rate' })
    }

    // Check if already rated
    const existing = await Rating.findOne({ raterId, betId })
    if (existing) {
      return res.status(400).json({ message: 'You have already rated this bet' })
    }

    const newRating = await Rating.create({
      raterId,
      ratedId,
      betId,
      rating: Math.min(5, Math.max(1, rating)),
      comment,
    })

    res.json({ message: 'Rating submitted', rating: newRating })
  } catch (error) {
    console.error('Rate error:', error)
    res.status(500).json({ message: 'Failed to submit rating' })
  }
})

// Get user's ratings (as rated)
router.get('/received', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId
    
    const ratings = await Rating.find({ ratedId: userId })
      .populate('raterId', 'email')
      .populate('betId', 'topic')
      .sort({ createdAt: -1 })
      .lean()

    const formatted = ratings.map(r => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      betTopic: r.betId?.topic,
      raterEmail: r.raterId?.email,
      createdAt: r.createdAt,
    }))

    // Calculate average
    const avg = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0

    res.json({ ratings: formatted, average: avg.toFixed(1), count: ratings.length })
  } catch (error) {
    console.error('Get ratings error:', error)
    res.status(500).json({ message: 'Failed to get ratings' })
  }
})

// Get user's given ratings
router.get('/given', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId
    
    const ratings = await Rating.find({ raterId: userId })
      .populate('ratedId', 'email')
      .populate('betId', 'topic')
      .sort({ createdAt: -1 })
      .lean()

    const formatted = ratings.map(r => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      betTopic: r.betId?.topic,
      ratedEmail: r.ratedId?.email,
      createdAt: r.createdAt,
    }))

    res.json(formatted)
  } catch (error) {
    console.error('Get given ratings error:', error)
    res.status(500).json({ message: 'Failed to get ratings' })
  }
})

export default router