import dns from 'dns'
dns.setServers(['8.8.8.8', '8.8.4.4'])

import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import cron from 'node-cron'

import authRoutes from './routes/auth.js'
import walletRoutes from './routes/wallet.js'
import betsRoutes from './routes/bets.js'
import userRoutes from './routes/users.js'
import transactionRoutes from './routes/transactions.js'
import ratingRoutes from './routes/ratings.js'
import verificationRoutes from './routes/verification.js'
import commentRoutes from './routes/comments.js'
import Bet from './models/Bet.js'
import User from './models/User.js'
import Transaction from './models/Transaction.js'
import { startDepositWatcher } from './services/depositWatcher.js'
import { startWithdrawalProcessor } from './services/withdrawalProcessor.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/bets', betsRoutes)
app.use('/api/users', userRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/ratings', ratingRoutes)
app.use('/api/verification', verificationRoutes)
app.use('/api/comments', commentRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FlowPredict API running' })
})

// Auto-resolve expired bets every hour
cron.schedule('0 * * * *', async () => {
  console.log('Checking for expired bets...')
  
  try {
    const now = new Date()
    
    // 1. Find OPEN bets that expired with NO participants - REFUND creator
    const openExpired = await Bet.find({
      status: 'OPEN',
      expiresAt: { $lte: now }
    })

    console.log(`Found ${openExpired.length} open expired bets`)

    for (const bet of openExpired) {
      // If no participants joined, refund creator
      if (!bet.participants || bet.participants.length === 0) {
        const creator = await User.findById(bet.creatorId)
        
        if (creator) {
          // Refund the stake
          creator.balance += bet.stake
          await creator.save()

          await Transaction.create({
            userId: creator._id,
            type: 'bet_refund',
            amount: bet.stake,
            betId: bet._id,
            description: `Bet expired with no participants - refunded: ${bet.topic}`,
          })

          // Mark as expired
          bet.status = 'EXPIRED'
          bet.resolution = 'Expired - no participants, refunded'
          await bet.save()

          console.log(`Bet ${bet._id} expired - creator refunded ${bet.stake} USDT`)
        }
      }
    }

    // 2. Find MATCHED bets that have expired - resolve to creator
    const matchedExpired = await Bet.find({
      status: 'MATCHED',
      expiresAt: { $lte: now }
    })

    console.log(`Found ${matchedExpired.length} matched expired bets to resolve`)

    for (const bet of matchedExpired) {
      // Default: creator wins (simplified - could add more logic)
      // Or first participant wins
      if (bet.participants && bet.participants.length > 0) {
        const winner = bet.participants[0]
        const winnerId = winner.userId
        const winnerUser = await User.findById(winnerId)
        
        if (winnerUser) {
          const totalPool = bet.stake * bet.requiredParticipants
          const payout = totalPool
          
          // Pay winner
          winnerUser.balance += payout
          await winnerUser.save()

          await Transaction.create({
            userId: winnerUser._id,
            type: 'bet_win',
            amount: payout,
            betId: bet._id,
            description: `Auto-resolved expired bet: ${bet.topic}`,
          })

          // Update bet
          bet.winnerId = winnerUser._id
          bet.resolution = 'Auto-resolved (expired)'
          bet.status = 'RESOLVED'
          await bet.save()

          console.log(`Resolved bet ${bet._id} - winner: ${winnerUser.email}`)
        }
      }
    }
  } catch (error) {
    console.error('Error resolving expired bets:', error)
  }
})

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flowpredict'

console.log('MongoDB URI:', MONGODB_URI.substring(0, 30) + '...')

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('Connected to MongoDB')
    startDepositWatcher()
    startWithdrawalProcessor()
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err)
  })

export default app