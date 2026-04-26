import mongoose, { Document, Schema } from 'mongoose'

export interface IOutcomeVerification extends Document {
  betId: mongoose.Types.ObjectId
  sourceType: 'api' | 'manual' | 'consensus'
  sourceUrl?: string // API endpoint for verification
  sourceValue?: string // What to check (e.g., "BTC > 50000")
  actualValue?: string // What the outcome turned out to be
  status: 'pending' | 'verified' | 'disputed' | 'failed'
  verifiedAt?: Date
  verifiedBy?: mongoose.Types.ObjectId
  evidence?: string // URL or proof of outcome
  votes?: { userId: mongoose.Types.ObjectId; outcome: string; votedAt: Date }[]
}

const OutcomeVerificationSchema = new Schema<IOutcomeVerification>({
  betId: {
    type: Schema.Types.ObjectId,
    ref: 'Bet',
    required: true,
  },
  sourceType: {
    type: String,
    enum: ['api', 'manual', 'consensus'],
    default: 'manual',
  },
  sourceUrl: String,
  sourceValue: String,
  actualValue: String,
  status: {
    type: String,
    enum: ['pending', 'verified', 'disputed', 'failed'],
    default: 'pending',
  },
  verifiedAt: Date,
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  evidence: String,
  votes: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    outcome: String,
    votedAt: { type: Date, default: Date.now }
  }],
}, {
  timestamps: true,
})

export default mongoose.model<IOutcomeVerification>('OutcomeVerification', OutcomeVerificationSchema)