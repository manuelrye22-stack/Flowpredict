import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'flowpredict_secret_key_2026'

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, walletAddress } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User({
      email,
      password: hashedPassword,
      walletAddress,
      balance: 0,
      isPro: false,
    })

    await user.save()

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        walletAddress: user.walletAddress,
        balance: user.balance,
        isPro: user.isPro,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ message: 'Registration failed' })
  }
})

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    // Check if banned
    if (user.isBanned) {
      return res.status(403).json({ 
        message: 'Account suspended. Contact support.',
        reason: user.banReason 
      })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        walletAddress: user.walletAddress,
        balance: user.balance,
        isPro: user.isPro,
        proExpiresAt: user.proExpiresAt,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Login failed' })
  }
})

router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const user = await User.findById(decoded.userId).select('-password')
    
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
    })
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' })
  }
})

export default router