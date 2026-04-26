import express, { Request, Response } from 'express'
import Bet from '../models/Bet.js'
import OutcomeVerification from '../models/OutcomeVerification.js'
import { verifyPrediction } from '../services/verificationService.js'

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

// Set verification method when creating bet
router.post('/bet/:betId', authenticate, async (req: Request, res: Response) => {
  try {
    const { sourceType, sourceUrl, sourceValue, evidence } = req.body
    const userId = req.body.userId

    const bet = await Bet.findById(req.params.betId)
    if (!bet) {
      return res.status(404).json({ message: 'Bet not found' })
    }

    // Only creator or admin can set verification
    if (bet.creatorId.toString() !== userId) {
      return res.status(403).json({ message: 'Only creator can set verification' })
    }

    // Check if already has verification
    let verification = await OutcomeVerification.findOne({ betId: bet._id })
    if (verification) {
      verification.sourceType = sourceType || verification.sourceType
      verification.sourceUrl = sourceUrl || verification.sourceUrl
      verification.sourceValue = sourceValue || verification.sourceValue
      verification.evidence = evidence || verification.evidence
      verification.status = 'pending'
      await verification.save()
    } else {
      verification = await OutcomeVerification.create({
        betId: bet._id,
        sourceType: sourceType || 'manual',
        sourceUrl,
        sourceValue,
        evidence,
        status: 'pending',
      })
    }

    res.json({ message: 'Verification method set', verification })
  } catch (error) {
    console.error('Set verification error:', error)
    res.status(500).json({ message: 'Failed to set verification' })
  }
})

// Verify outcome (admin or agreed by both parties)
router.post('/bet/:betId/verify', authenticate, async (req: Request, res: Response) => {
  try {
    const { actualValue, winnerId } = req.body
    const userId = req.body.userId

    const bet = await Bet.findById(req.params.betId)
    if (!bet) {
      return res.status(404).json({ message: 'Bet not found' })
    }

    const verification = await OutcomeVerification.findOne({ betId: bet._id })
    if (!verification) {
      return res.status(400).json({ message: 'No verification method set' })
    }

    // For consensus, require both parties to agree
    if (verification.sourceType === 'consensus') {
      const isParticipant = bet.participants.some((p: any) => p.userId.toString() === userId)
      if (!isParticipant) {
        return res.status(403).json({ message: 'Only participants can verify' })
      }
    }

    verification.actualValue = actualValue
    verification.status = 'verified'
    verification.verifiedAt = new Date()
    verification.verifiedBy = userId
    await verification.save()

    res.json({ 
      message: 'Outcome verified', 
      verification,
      nextStep: 'Now resolve the bet with winner: ' + winnerId
    })
  } catch (error) {
    console.error('Verify outcome error:', error)
    res.status(500).json({ message: 'Failed to verify outcome' })
  }
})

// Get verification status for a bet
router.get('/bet/:betId', async (req: Request, res: Response) => {
  try {
    const verification = await OutcomeVerification.findOne({ betId: req.params.betId })
    if (!verification) {
      return res.json({ status: 'not_set' })
    }
    res.json(verification)
  } catch (error) {
    res.status(500).json({ message: 'Failed to get verification' })
  }
})

// Vote on consensus outcome
router.post('/bet/:betId/consensus-vote', authenticate, async (req: Request, res: Response) => {
  try {
    const { outcome } = req.body // 'YES' or 'NO'
    const userId = req.body.userId

    const bet = await Bet.findById(req.params.betId)
    if (!bet) {
      return res.status(404).json({ message: 'Bet not found' })
    }

    const verification = await OutcomeVerification.findOne({ betId: bet._id })
    if (!verification || verification.sourceType !== 'consensus') {
      return res.status(400).json({ message: 'Not a consensus bet' })
    }

    // Check user is a participant
    const isParticipant = bet.participants.some((p: any) => p.userId.toString() === userId)
    if (!isParticipant) {
      return res.status(403).json({ message: 'Only participants can vote' })
    }

    // Initialize votes if not exist
    if (!verification.votes) {
      verification.votes = []
    }

    // Check if already voted
    const existingVote = verification.votes.find((v: any) => v.userId.toString() === userId)
    if (existingVote) {
      return res.status(400).json({ message: 'You have already voted' })
    }

    // Add vote
    verification.votes.push({ userId, outcome, votedAt: new Date() })
    await verification.save()

    // Check if both voted
    if (verification.votes.length === 2) {
      const vote1 = verification.votes[0].outcome
      const vote2 = verification.votes[1].outcome

      if (vote1 === vote2) {
        // Both agree - outcome confirmed
        verification.status = 'verified'
        verification.actualValue = vote1
        verification.verifiedAt = new Date()
        await verification.save()

        return res.json({
          message: 'Consensus reached! Both agreed.',
          outcome: vote1,
          consensus: true
        })
      } else {
        // Disagreement - escalate to dispute
        bet.status = 'DISPUTED'
        bet.resolution = 'Consensus failed - both parties disagreed. Admin resolution required.'
        await bet.save()

        verification.status = 'disputed'
        await verification.save()

        return res.json({
          message: 'Disagreement! Bet escalated to dispute. Admin will resolve.',
          consensus: false,
          escalated: true
        })
      }
    }

    res.json({ 
      message: 'Vote recorded. Waiting for other participant to vote.',
      votesCount: verification.votes.length
    })
  } catch (error) {
    console.error('Consensus vote error:', error)
    res.status(500).json({ message: 'Failed to record vote' })
  }
})

// Auto-verify using API (for crypto, weather)
router.post('/bet/:betId/auto-verify', async (req: Request, res: Response) => {
  try {
    const bet = await Bet.findById(req.params.betId)
    if (!bet) {
      return res.status(404).json({ message: 'Bet not found' })
    }

    const verification = await OutcomeVerification.findOne({ betId: bet._id })
    if (!verification) {
      return res.status(400).json({ message: 'No verification set' })
    }

    if (verification.sourceType !== 'api') {
      return res.status(400).json({ message: 'Only API verification can be auto-verified' })
    }

    // Run auto-verification based on category
    const result = await verifyPrediction(
      bet.category,
      bet.topic,
      bet.direction
    )

    // Update verification record
    verification.actualValue = result.actualValue || ''
    verification.status = result.success && result.outcome !== 'UNDETERMINED' ? 'verified' : 'failed'
    verification.evidence = result.details
    await verification.save()

    res.json({
      success: result.success,
      outcome: result.outcome,
      actualValue: result.actualValue,
      details: result.details,
      source: result.source,
      message: result.success 
        ? `Verified: ${result.outcome === 'YES' ? 'Prediction was CORRECT' : 'Prediction was WRONG'}`
        : 'Could not auto-verify. Manual verification required.'
    })
  } catch (error: any) {
    console.error('Auto-verify error:', error)
    res.status(500).json({ message: 'Auto-verification failed: ' + error.message })
  }
})

export default router