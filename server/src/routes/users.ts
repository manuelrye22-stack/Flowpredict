import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
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

router.get('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.body.userId).select('-password')
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      _id: user._id,
      email: user.email,
      walletAddress: user.walletAddress,
      balance: user.balance,
      isPro: user.isPro,
      proExpiresAt: user.proExpiresAt,
      createdAt: user.createdAt,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to get profile' })
  }
})

router.post('/subscription', authenticate, async (req: Request, res: Response) => {
  try {
    const { plan } = req.body

    if (plan !== 'pro') {
      return res.status(400).json({ message: 'Invalid plan' })
    }

    const user = await User.findById(req.body.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const now = new Date()
    const expires = new Date(now)
    expires.setMonth(expires.getMonth() + 1)

    user.isPro = true
    user.proExpiresAt = expires
    await user.save()

    res.json({ 
      message: 'Subscription activated', 
      isPro: user.isPro,
      proExpiresAt: user.proExpiresAt 
    })
  } catch (error) {
    console.error('Subscription error:', error)
    res.status(500).json({ message: 'Subscription failed' })
  }
})

export default router