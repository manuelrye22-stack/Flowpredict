import mongoose, { Document, Schema } from 'mongoose'

export interface IRating extends Document {
  raterId: mongoose.Types.ObjectId
  ratedId: mongoose.Types.ObjectId
  betId: mongoose.Types.ObjectId
  rating: number // 1-5
  comment?: string
  createdAt: Date
}

const RatingSchema = new Schema<IRating>({
  raterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ratedId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  betId: {
    type: Schema.Types.ObjectId,
    ref: 'Bet',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    maxLength: 500,
  },
}, {
  timestamps: true,
})

// One rating per user per bet
RatingSchema.index({ raterId: 1, betId: 1 }, { unique: true })

export default mongoose.model<IRating>('Rating', RatingSchema)