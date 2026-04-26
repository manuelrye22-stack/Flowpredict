import mongoose, { Document, Schema } from 'mongoose'

export interface IComment extends Document {
  betId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  content: string
  createdAt: Date
}

const CommentSchema = new Schema<IComment>({
  betId: {
    type: Schema.Types.ObjectId,
    ref: 'Bet',
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
})

export default mongoose.model<IComment>('Comment', CommentSchema)