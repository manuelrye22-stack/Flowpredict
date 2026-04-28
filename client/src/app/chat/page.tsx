'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { chatAPI } from '@/lib/api'

interface Message {
  _id: string
  senderId: { _id: string } | string
  senderUsername: string
  content: string
  createdAt: string
}

export default function Chat() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }

    loadMessages()
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000)
    return () => clearInterval(interval)
  }, [router])

  const loadMessages = async () => {
    try {
      const res = await chatAPI.getMessages()
      setMessages(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      await chatAPI.sendMessage(newMessage)
      setNewMessage('')
      loadMessages()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send')
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading chat...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-gray-800 rounded-lg shadow-lg h-[calc(100vh-8rem)] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <h1 className="text-xl font-bold">💬 Chat</h1>
            <p className="text-sm text-gray-400">{messages.length} messages</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg, idx) => {
                const senderId = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId?._id
                const isOwn = user && senderId === user._id
                const showDate = idx === 0 || 
                  new Date(msg.createdAt).toDateString() !== new Date(messages[idx - 1].createdAt).toDateString()
                
                return (
                  <div key={msg._id}>
                    {showDate && (
                      <div className="text-center text-gray-500 text-xs my-2">
                        {formatDate(msg.createdAt)}
                      </div>
                    )}
                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'bg-blue-600' : 'bg-gray-700'} rounded-lg px-3 py-2`}>
                        <p className="text-xs font-bold text-blue-200 mb-1">
                          {msg.senderUsername}
                          <span className="text-gray-400 font-normal ml-2">
                            {formatTime(msg.createdAt)}
                          </span>
                        </p>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}