'use client'

import { useState, useEffect } from 'react'
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message: string
  read: boolean
  createdAt: Date
}

export function NotificationBanner() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Listen for notifications from localStorage (simple cross-tab notification)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'flowpredict_notification') {
        const notification = JSON.parse(e.newValue || '{}')
        if (notification.id) {
          setNotifications(prev => [notification, ...prev].slice(0, 10))
          setShowBanner(true)
        }
      }
    }

    window.addEventListener('storage', handleStorage)

    // Check for stored notifications on load
    const stored = localStorage.getItem('flowpredict_notifications')
    if (stored) {
      const parsed = JSON.parse(stored)
      setNotifications(parsed)
    }

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      const stored = localStorage.getItem('flowpredict_notifications')
      if (stored) {
        const parsed = JSON.parse(stored)
        const currentLength = notifications.length
        if (parsed.length > currentLength) {
          setNotifications(parsed)
          setShowBanner(true)
        }
      }
    }, 30000)

    return () => {
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, [])

  const dismissNotification = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n)
    setNotifications(updated)
    localStorage.setItem('flowpredict_notifications', JSON.stringify(updated))
  }

  const clearAll = () => {
    setNotifications([])
    setShowBanner(false)
    localStorage.setItem('flowpredict_notifications', JSON.stringify([]))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (!showBanner && unreadCount === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Notification Banner */}
      {showBanner && unreadCount > 0 && (
        <div className="bg-gradient-to-r from-nigeria-green to-green-600 text-white px-4 py-2 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 animate-pulse" />
              <span className="font-medium">
                {unreadCount} new notification{unreadCount > 1 ? 's' : ''}!
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBanner(false)}
                className="text-white/80 hover:text-white text-sm underline"
              >
                View Later
              </button>
              <button
                onClick={clearAll}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Dropdown */}
      {showBanner && (
        <div className="absolute top-full right-4 w-96 bg-white rounded-lg shadow-xl border mt-2 max-h-96 overflow-y-auto">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            <button onClick={clearAll} className="text-sm text-red-500 hover:underline">
              Clear All
            </button>
          </div>
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notifications yet
            </div>
          ) : (
            <div>
              {notifications.slice(0, 10).map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 border-b last:border-b-0 flex gap-3 ${
                    !notif.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="mt-1">
                    {notif.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {notif.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                    {notif.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notif.title}</p>
                    <p className="text-xs text-gray-600">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => dismissNotification(notif.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper function to trigger notifications from anywhere
export function triggerNotification(notification: Omit<Notification, 'createdAt'>) {
  const newNotif = {
    ...notification,
    createdAt: new Date()
  }
  
  // Store in localStorage
  const stored = localStorage.getItem('flowpredict_notifications')
  const existing = stored ? JSON.parse(stored) : []
  const updated = [newNotif, ...existing].slice(0, 10)
  localStorage.setItem('flowpredict_notifications', JSON.stringify(updated))
  
  // Also set the current notification for cross-tab
  localStorage.setItem('flowpredict_notification', JSON.stringify(newNotif))
}

export default NotificationBanner
