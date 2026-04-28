import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import Message from '../models/Message.js'
import User from '../models/User.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'flowpredict_secret_key_2026'

const authenticate = (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    req.body.userId = decoded.userId
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

// Get recent messages
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.query
    
    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(Number(limit))
    
    res.json(messages.reverse())
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ message: 'Failed to get messages' })
  }
})

// Send message
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { content } = req.body
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' })
    }

    const user = await User.findById(req.body.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    // Check if banned
    if (user.isBanned) {
      return res.status(403).json({ message: 'Account suspended' })
    }

    const message = await Message.create({
      senderId: user._id,
      senderUsername: user.username || user.email.split('@')[0],
      content: content.trim(),
    })

    res.status(201).json(message)
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ message: 'Failed to send message' })
  }
})

// Delete message (admin or own message)
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.body.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const message = await Message.findById(req.params.id)
    if (!message) {
      return res.status(404).json({ message: 'Message not found' })
    }

    // Allow delete if admin/superadmin or own message
    if (!['admin', 'superadmin'].includes(user.role || 'user') && message.senderId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Cannot delete this message' })
    }

    await Message.findByIdAndDelete(req.params.id)
    res.json({ message: 'Message deleted' })
  } catch (error) {
    console.error('Delete message error:', error)
    res.status(500).json({ message: 'Failed to delete message' })
  }
})

export default router