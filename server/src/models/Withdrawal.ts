import mongoose, { Document, Schema } from 'mongoose'

export interface IWithdrawal extends Document {
  userId: mongoose.Types.ObjectId
  amount: number
  address: string // TRC-20 address
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'
  txHash?: string
  requestedAt: Date
  processedAt?: Date
  processedBy?: mongoose.Types.ObjectId
  notes?: string
}

const WithdrawalSchema = new Schema<IWithdrawal>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'failed'],
    default: 'pending',
  },
  txHash: String,
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: Date,
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: String,
})

export default mongoose.model<IWithdrawal>('Withdrawal', WithdrawalSchema)