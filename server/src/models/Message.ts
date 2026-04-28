import mongoose, { Document, Schema } from 'mongoose'

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId
  senderUsername: string
  content: string
  createdAt: Date
}

const MessageSchema = new Schema<IMessage>({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderUsername: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

MessageSchema.index({ createdAt: -1 })

export default mongoose.model<IMessage>('Message', MessageSchema)