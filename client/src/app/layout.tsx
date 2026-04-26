import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ThemeToggle from '@/components/ThemeToggle'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FlowPredict - P2P Crypto Prediction Market',
  description: 'Create and accept predictions on sports, crypto, and custom topics. Bet against other users directly.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-nigeria-green text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <a href="/" className="text-xl font-bold">FlowPredict</a>
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    <a href="/bets" className="hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium">Browse Bets</a>
                    <a href="/bets/create" className="hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium">Create Bet</a>
                    <a href="/dashboard" className="hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
                    <a href="/profile" className="hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium">📊 Profile</a>
                    <a href="/leaderboard" className="hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium">🏆 Leaderboard</a>
                    <a href="/admin" className="hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium">Admin</a>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <ThemeToggle />
                  <a href="/login" className="hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium">Login</a>
                  <a href="/register" className="bg-nigeria-orange text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-600">Sign Up</a>
                </div>
              </div>
            </div>
          </nav>
          <main>{children}</main>
          <footer className="bg-gray-800 text-white py-8 mt-16">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p>&copy; 2026 FlowPredict. P2P Crypto Predictions.</p>
              <p className="text-gray-400 text-sm mt-2">Bet responsibly. P2P predictions with no platform cut from bets.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}