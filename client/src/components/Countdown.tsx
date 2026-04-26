'use client'

import { useState, useEffect } from 'react'

interface CountdownProps {
  expiresAt: string | Date | null
}

export default function Countdown({ expiresAt }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft('')
      return
    }

    const calculateTimeLeft = () => {
      const now = new Date()
      const expiry = new Date(expiresAt)
      const diff = expiry.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft('EXPIRED')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`)
      } else {
        setTimeLeft(`${minutes}m`)
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [expiresAt])

  if (!expiresAt) return null

  const isExpired = timeLeft === 'EXPIRED'
  
  return (
    <span className={isExpired ? 'text-red-600 font-bold' : 'text-orange-600'}>
      {isExpired ? '⏰ Expired' : `⏱ ${timeLeft}`}
    </span>
  )
}