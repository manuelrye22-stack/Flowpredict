import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import Bet from '../models/Bet.js'
import User from '../models/User.js'
import Transaction from '../models/Transaction.js'

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

router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, status } = req.query
    
    const query: any = {}
    if (category && category !== 'All') query.category = category
    if (status) query.status = status

    const bets = await Bet.find(query)
      .populate('creatorId', 'email')
      .populate('participants.userId', 'email')
      .populate('winnerId', 'email')
      .sort({ createdAt: -1 })
      .limit(100)

    res.json(bets)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bets' })
  }
})

router.get('/my', authenticate, async (req: Request, res: Response) => {
  try {
    const bets = await Bet.find({
      $or: [
        { creatorId: req.body.userId },
        { 'participants.userId': req.body.userId }
      ]
    })
      .populate('creatorId', 'email')
      .populate('participants.userId', 'email')
      .sort({ createdAt: -1 })

    res.json(bets)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch your bets' })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const bet = await Bet.findById(req.params.id)
      .populate('creatorId', 'email walletAddress')
      .populate('participants.userId', 'email')

    if (!bet) {
      return res.status(404).json({ message: 'Bet not found' })
    }

    res.json(bet)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bet' })
  }
})

// CREATE BET
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { topic, category, odds, stake, direction, expiresAt } = req.body

    // Validate odds (must be at least 2 for multi-participant model)
    if (odds < 2 || odds > 10) {
      return res.status(400).json({ message: 'Odds must be between 2x and 10x' })
    }

    const user = await User.findById(req.body.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (user.balance < stake) {
      return res.status(400).json({ message: 'Insufficient balance' })
    }

    const nairaValue = stake * 1550
    if (nairaValue >= 30000 && !user.isPro) {
      return res.status(400).json({ 
        message: 'Pro subscription required for bets over ₦30,000. Please upgrade to Pro.' 
      })
    }

    // Deduct stake from user
    user.balance -= stake
    await user.save()

    await Transaction.create({
      userId: user._id,
      type: 'bet_create',
      amount: -stake,
      description: `Created bet: ${topic}`,
    })

    // Create bet with creator as first participant
    const bet = new Bet({
      creatorId: user._id,
      topic,
      category,
      odds,
      stake,
      direction,
      requiredParticipants: odds, // e.g., 3x odds = 3 participants needed
      participants: [{
        userId: user._id,
        direction,
        stake,
        joinedAt: new Date()
      }],
      status: odds === 1 ? 'MATCHED' : 'OPEN', // 1x would match immediately (rare)
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    })

    await bet.save()

    res.status(201).json(bet)
  } catch (error) {
    console.error('Create bet error:', error)
    res.status(500).json({ message: 'Failed to create bet' })
  }
})

// JOIN/ACCEPT BET
router.post('/:id/accept', authenticate, async (req: Request, res: Response) => {
  try {
    const bet = await Bet.findById(req.params.id)
    
    if (!bet) {
      return res.status(404).json({ message: 'Bet not found' })
    }

    if (bet.status !== 'OPEN') {
      return res.status(400).json({ message: 'Bet is not open for acceptance' })
    }

    // Check if user is the creator
    if (bet.creatorId.toString() === req.body.userId) {
      return res.status(400).json({ message: 'Cannot join your own bet' })
    }

    // Check if user already joined
    const alreadyJoined = bet.participants.some(
      (p: any) => p.userId.toString() === req.body.userId
    )
    if (alreadyJoined) {
      return res.status(400).json({ message: 'You have already joined this bet' })
    }

    const user = await User.findById(req.body.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (user.balance < bet.stake) {
      return res.status(400).json({ message: 'Insufficient balance' })
    }

    // Check if user is trying to take opposite direction
    const creatorDirection = bet.participants[0].direction
    const joiningDirection = creatorDirection === 'YES' ? 'NO' : 'YES'

    // Deduct stake
    user.balance -= bet.stake
    await user.save()

    await Transaction.create({
      userId: user._id,
      type: 'bet_accept',
      amount: -bet.stake,
      description: `Joined bet: ${bet.topic}`,
    })

    // Add participant
    bet.participants.push({
      userId: user._id,
      direction: joiningDirection,
      stake: bet.stake,
      joinedAt: new Date()
    })

    // Notify bet creator
    const creator = await User.findById(bet.creatorId)
    if (creator && creator._id.toString() !== user._id.toString()) {
      const creatorNotifs = creator.notifications || []
      creatorNotifs.unshift({
        type: 'bet_join',
        title: 'Someone joined your bet!',
        message: `${user.email.split('@')[0]} accepted your bet "${bet.topic}"`,
        read: false,
        createdAt: new Date()
      })
      creator.notifications = creatorNotifs.slice(0, 50) // Keep last 50
      await creator.save()
    }

    // Check if bet is now full
    if (bet.participants.length >= bet.requiredParticipants) {
      bet.status = 'MATCHED'
    }

    await bet.save()

    const participantsNeeded = bet.requiredParticipants - bet.participants.length
    res.json({ 
      message: participantsNeeded > 0 
        ? `Joined! Still need ${participantsNeeded} more participant(s)` 
        : 'Bet is now fully matched!',
      participantsNeeded,
      bet 
    })
  } catch (error) {
    console.error('Accept bet error:', error)
    res.status(500).json({ message: 'Failed to join bet' })
  }
})

// RESOLVE BET
router.post('/:id/resolve', authenticate, async (req: Request, res: Response) => {
  try {
    const { winnerId, resolution } = req.body

    const bet = await Bet.findById(req.params.id)
    
    if (!bet) {
      return res.status(404).json({ message: 'Bet not found' })
    }

    if (bet.status !== 'MATCHED') {
      return res.status(400).json({ message: 'Bet cannot be resolved' })
    }

    // Verify winner is a participant
    const isParticipant = bet.participants.some(
      (p: any) => p.userId.toString() === winnerId
    )
    if (!isParticipant) {
      return res.status(400).json({ message: 'Winner must be a participant' })
    }

    const winner = await User.findById(winnerId)
    if (!winner) {
      return res.status(404).json({ message: 'Winner not found' })
    }

    // Calculate payout: total pool = stake × number of participants = stake × odds
    const totalPool = bet.stake * bet.requiredParticipants
    const payout = totalPool // Winner gets everything (stake × odds)

    // Give winnings to winner
    winner.balance += payout
    await winner.save()

    // Find opponent info
    const opponents = bet.participants.filter((p: any) => p.userId.toString() !== winnerId)
    const opponent = opponents[0]
    const opponentUser = opponent ? await User.findById(opponent.userId) : null

    // Create transaction for winner with receipt details
    await Transaction.create({
      userId: winner._id,
      type: 'bet_win',
      amount: payout,
      status: 'completed',
      betId: bet._id,
      description: `Won bet: ${bet.topic}`,
      betTopic: bet.topic,
      betOdds: bet.odds,
      opponentId: opponent?.userId?.toString(),
      opponentEmail: opponentUser?.email,
    })

    // Create loss transactions for losers
    for (const opp of opponents) {
      const oppUser = await User.findById(opp.userId)
      if (oppUser) {
        await Transaction.create({
          userId: oppUser._id,
          type: 'bet_lose',
          amount: -opp.stake,
          status: 'completed',
          betId: bet._id,
          description: `Lost bet: ${bet.topic}`,
          betTopic: bet.topic,
          betOdds: bet.odds,
          opponentId: winner._id.toString(),
          opponentEmail: winner.email,
        })
      }
    }

    // Update bet status
    bet.winnerId = winner._id
    bet.resolution = resolution || 'Resolved'
    bet.status = 'RESOLVED'
    await bet.save()

    res.json({ 
      message: 'Bet resolved', 
      winner: winner.email,
      payout,
      pool: totalPool,
      bet 
    })
  } catch (error) {
    console.error('Resolve bet error:', error)
    res.status(500).json({ message: 'Failed to resolve bet' })
  }
})

// OPT-OUT / LEAVE BET - DISABLED (Bets are now binding)
router.post('/:id/leave', authenticate, async (req: Request, res: Response) => {
  return res.status(400).json({ 
    message: `Cannot leave - bets are now binding. Once you create or join a bet, you cannot leave until resolved.`
  })
})

// DISPUTE BET
router.post('/:id/dispute', authenticate, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body

    const bet = await Bet.findById(req.params.id)
    
    if (!bet) {
      return res.status(404).json({ message: 'Bet not found' })
    }

    // Check if user is a participant
    const isParticipant = bet.participants.some(
      (p: any) => p.userId.toString() === req.body.userId
    )
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to dispute this bet' })
    }

    bet.status = 'DISPUTED'
    await bet.save()

    res.json({ message: 'Dispute raised. Admin will review.', bet })
  } catch (error) {
    console.error('Dispute error:', error)
    res.status(500).json({ message: 'Failed to raise dispute' })
  }
})

export default router