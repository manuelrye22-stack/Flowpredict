import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ThemeToggle from '@/components/ThemeToggle'
import NotificationBanner from '@/components/NotificationBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FlowPredict - P2P Crypto Prediction Market',
  description: 'Create and accept predictions on sports, crypto, and custom topics. Bet against other users directly.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <NotificationBanner />
        <nav className="bg-nigeria-green dark:bg-gray-800 text-white dark:text-gray-100 shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <a href="/" className="text-lg sm:text-xl font-bold">FlowPredict</a>
              
              {/* Desktop Nav */}
              <div className="hidden lg:flex items-baseline space-x-2">
                <a href="/bets" className="hover:bg-green-700 px-2 py-2 rounded-md text-sm font-medium">Bets</a>
                <a href="/bets/create" className="hover:bg-green-700 px-2 py-2 rounded-md text-sm font-medium">Create</a>
                <a href="/dashboard" className="hover:bg-green-700 px-2 py-2 rounded-md text-sm font-medium">Dashboard</a>
                <a href="/leaderboard" className="hover:bg-green-700 px-2 py-2 rounded-md text-sm font-medium">🏆</a>
                <a href="/chat" className="hover:bg-green-700 px-2 py-2 rounded-md text-sm font-medium">💬</a>
                <a href="/admin" className="hover:bg-green-700 px-2 py-2 rounded-md text-sm font-medium">Admin</a>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2">
                <ThemeToggle />
                <a href="/login" className="text-xs sm:text-sm hover:bg-green-700 px-2 py-2 rounded-md">Login</a>
                <a href="/register" className="bg-nigeria-orange text-white px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-orange-600">Sign Up</a>
              </div>
            </div>
            
            {/* Mobile Nav - Icons only */}
            <div className="lg:hidden flex justify-around py-2 border-t border-green-600 -mx-3 sm:-mx-4 px-3 sm:px-4">
              <a href="/bets" className="flex flex-col items-center text-xs">
                <span>🎯</span>
                <span>Bets</span>
              </a>
              <a href="/bets/create" className="flex flex-col items-center text-xs">
                <span>➕</span>
                <span>Create</span>
              </a>
              <a href="/dashboard" className="flex flex-col items-center text-xs">
                <span>📊</span>
                <span>Dash</span>
              </a>
              <a href="/profile" className="flex flex-col items-center text-xs">
                <span>👤</span>
                <span>Profile</span>
              </a>
              <a href="/leaderboard" className="flex flex-col items-center text-xs">
                <span>🏆</span>
                <span>Top</span>
              </a>
              <a href="/chat" className="flex flex-col items-center text-xs">
                <span>💬</span>
                <span>Chat</span>
              </a>
            </div>
          </div>
        </nav>
        <main className="px-3 sm:px-4 pb-20 lg:pb-8">{children}</main>
        <footer className="bg-gray-800 dark:bg-gray-950 text-white py-6 sm:py-8 mt-12 sm:mt-16">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 text-center">
            <p>&copy; 2026 FlowPredict. P2P Crypto Predictions.</p>
            <p className="text-gray-400 text-sm mt-1">Bet responsibly.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}