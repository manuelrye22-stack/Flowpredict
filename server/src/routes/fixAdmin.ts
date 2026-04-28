import { Router, Request, Response } from 'express'
import User from '../models/User.js'

const router = Router()

// Quick fix - set superadmin for manuelrye22@gmail.com
router.get('/fix-admin', async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ email: 'manuelrye22@gmail.com' })
    if (!user) {
      return res.json({ message: 'User not found' })
    }
    
    user.role = 'superadmin'
    await user.save()
    
    res.json({ message: 'Fixed! User is now superadmin', role: user.role })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router