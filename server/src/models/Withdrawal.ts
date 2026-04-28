import mongoose, { Document, Schema } from 'mongoose'

export interface IWithdrawal extends Document {
  userId: mongoose.Types.ObjectId
  amount: number
  tipAmount?: number // Optional tip to platform
  address: string // TRC-20 or LTC address
  network: 'USDT' | 'LTC'
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
  tipAmount: {
    type: Number,
    default: 0,
  },
  address: {
    type: String,
    required: true,
  },
  network: {
    type: String,
    enum: ['USDT', 'LTC'],
    default: 'USDT',
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