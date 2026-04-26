import mongoose, { Document, Schema } from 'mongoose'

export interface IDeposit extends Document {
  txHash: string
  fromAddress: string
  toAddress: string
  amount: number
  userId?: mongoose.Types.ObjectId
  status: 'pending' | 'credited' | 'failed'
  confirmed: boolean
  blockNumber?: number
  createdAt: Date
  creditedAt?: Date
}

const DepositSchema = new Schema<IDeposit>({
  txHash: {
    type: String,
    required: true,
    unique: true,
  },
  fromAddress: {
    type: String,
    required: true,
  },
  toAddress: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['pending', 'credited', 'failed'],
    default: 'pending',
  },
  confirmed: {
    type: Boolean,
    default: false,
  },
  blockNumber: {
    type: Number,
  },
  creditedAt: {
    type: Date,
  },
}, {
  timestamps: true,
})

DepositSchema.index({ toAddress: 1 })

export default mongoose.model<IDeposit>('Deposit', DepositSchema)