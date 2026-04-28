import mongoose, { Document, Schema } from 'mongoose'

export interface IParticipant {
  userId: mongoose.Types.ObjectId
  direction: 'YES' | 'NO'
  stake: number
  joinedAt: Date
}

export interface IBet extends Document {
  creatorId: mongoose.Types.ObjectId
  topic: string
  category: string
  odds: number
  stake: number
  direction: 'YES' | 'NO'
  participants: IParticipant[]
  requiredParticipants: number
  status: 'OPEN' | 'MATCHED' | 'RESOLVED' | 'DISPUTED' | 'EXPIRED' | 'CLOSED'
  winnerId?: mongoose.Types.ObjectId
  resolution?: string
  createdAt: Date
  expiresAt?: Date
}

const ParticipantSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  direction: {
    type: String,
    enum: ['YES', 'NO'],
    required: true,
  },
  stake: {
    type: Number,
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
})

const BetSchema = new Schema<IBet>({
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Sports', 'Crypto', 'Custom'],
    required: true,
  },
  odds: {
    type: Number,
    required: true,
    min: 2,  // Minimum 2x odds (2 participants needed)
    max: 10, // Maximum 10x odds
  },
  stake: {
    type: Number,
    required: true,
    min: 1,
  },
  direction: {
    type: String,
    enum: ['YES', 'NO'],
    required: true,
  },
  participants: [ParticipantSchema],
  requiredParticipants: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['OPEN', 'MATCHED', 'RESOLVED', 'DISPUTED', 'CLOSED'],
    default: 'OPEN',
  },
  winnerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  resolution: {
    type: String,
  },
  expiresAt: {
    type: Date,
  },
}, {
  timestamps: true,
})

export default mongoose.model<IBet>('Bet', BetSchema)