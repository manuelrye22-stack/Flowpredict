import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import Comment from '../models/Comment.js'
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
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

// Get comments for a bet
router.get('/:betId', authenticate, async (req: Request, res: Response) => {
  try {
    const comments = await Comment.find({ betId: req.params.betId })
      .populate('userId', 'email')
      .sort({ createdAt: -1 })
    
    const formatted = comments.map(c => ({
      _id: c._id,
      content: c.content,
      email: c.userId?.email?.split('@')[0],
      createdAt: c.createdAt,
    }))
    
    res.json(formatted)
  } catch (error) {
    res.status(500).json({ message: 'Failed to get comments' })
  }
})

// Add comment to a bet
router.post('/:betId', authenticate, async (req: Request, res: Response) => {
  try {
    const { content } = req.body
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Comment cannot be empty' })
    }

    const user = await User.findById(req.body.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const comment = await Comment.create({
      betId: req.params.betId,
      userId: req.body.userId,
      content: content.trim(),
    })

    res.json({ message: 'Comment posted', comment })
  } catch (error) {
    console.error('Comment error:', error)
    res.status(500).json({ message: 'Failed to post comment' })
  }
})

// Delete comment (only by the comment author)
router.delete('/:commentId', authenticate, async (req: Request, res: Response) => {
  try {
    const comment = await Comment.findById(req.params.commentId)
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    if (comment.userId.toString() !== req.body.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' })
    }

    await comment.deleteOne()

    res.json({ message: 'Comment deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete comment' })
  }
})

export default router