import mongoose, { Document, Schema } from 'mongoose'

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId
  type: 'deposit' | 'withdraw' | 'bet_create' | 'bet_accept' | 'bet_win' | 'bet_lose' | 'bet_refund'
  amount: number
  status: 'pending' | 'completed' | 'failed'
  txHash?: string
  betId?: mongoose.Types.ObjectId
  description?: string
  // Receipt details
  betTopic?: string
  betOdds?: number
  opponentId?: string
  opponentEmail?: string
  createdAt: Date
}

const TransactionSchema = new Schema<ITransaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['deposit', 'withdraw', 'bet_create', 'bet_accept', 'bet_win', 'bet_lose', 'bet_refund'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed',
  },
  txHash: {
    type: String,
  },
  betId: {
    type: Schema.Types.ObjectId,
    ref: 'Bet',
  },
  description: {
    type: String,
  },
  // Receipt details
  betTopic: {
    type: String,
  },
  betOdds: {
    type: Number,
  },
  opponentId: {
    type: String,
  },
  opponentEmail: {
    type: String,
  },
}, {
  timestamps: true,
})

export default mongoose.model<ITransaction>('Transaction', TransactionSchema)