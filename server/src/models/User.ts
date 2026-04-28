import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  email: string
  password: string
  walletAddress: string
  balance: number
  isPro: boolean
  proExpiresAt?: Date
  createdAt: Date
  updatedAt: Date
  notifications?: Array<{
    type: string
    title: string
    message: string
    read: boolean
    createdAt: Date
  }>
  preferredNetwork?: 'USDT' | 'LTC'
  lastDepositMethod?: 'USDT' | 'LTC'
  isBanned?: boolean
  banReason?: string
  flagged?: boolean
  flagReason?: string
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  walletAddress: {
    type: String,
  },
  balance: {
    type: Number,
    default: 0,
  },
  isPro: {
    type: Boolean,
    default: false,
  },
  proExpiresAt: {
    type: Date,
  },
  notifications: [{
    type: String,
    title: String,
    message: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  preferredNetwork: {
    type: String,
    enum: ['USDT', 'LTC'],
  },
  lastDepositMethod: {
    type: String,
    enum: ['USDT', 'LTC'],
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  banReason: {
    type: String,
  },
  flagged: {
    type: Boolean,
    default: false,
  },
  flagReason: {
    type: String,
  },
}, {
  timestamps: true,
})

export default mongoose.model<IUser>('User', UserSchema)