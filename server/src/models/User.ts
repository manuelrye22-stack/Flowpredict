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
}, {
  timestamps: true,
})

export default mongoose.model<IUser>('User', UserSchema)