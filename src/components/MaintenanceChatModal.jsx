import { useState, useEffect, useRef } from 'react'
import { X, Send, MessageSquare, User, Shield, Wrench } from 'lucide-react'
import { api, useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import toast from 'react-hot-toast'

export default function MaintenanceChatModal({ isOpen, onClose, request }) {
  const { user } = useAuth()
  const socket = useSocket()
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!isOpen || !request) return

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/api/maintenance/${request.id}/messages`)
        setMessages(res.data.messages || [])
      } catch (err) {
        console.error('Failed to load chat messages:', err)
      }
    }

    fetchMessages()

    if (socket) {
      const handleNewMessage = (newMsg) => {
        if (newMsg.request_id === request.id) {
          setMessages(prev => [...prev, newMsg])
        }
      }
      socket.on('maintenance:message', handleNewMessage)
      return () => {
        socket.off('maintenance:message', handleNewMessage)
      }
    }
  }, [isOpen, request, socket])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!isOpen || !request) return null

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const textToSend = inputText.trim()
    setInputText('')
    setLoading(true)

    try {
      const res = await api.post(`/api/maintenance/${request.id}/messages`, {
        message: textToSend
      })
      // If socket doesn't loop back to sender or for instant feel
      if (!socket?.connected) {
        setMessages(prev => [...prev, res.data.message])
      }
    } catch (err) {
      toast.error('Failed to send message')
      setInputText(textToSend)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role) => {
    if (role === 'owner') return <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"><Shield className="w-2.5 h-2.5"/>Owner</span>
    if (role === 'staff') return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"><Wrench className="w-2.5 h-2.5"/>Staff</span>
    return <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"><User className="w-2.5 h-2.5"/>Tenant</span>
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col h-[520px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary-600 text-white p-4 flex items-center justify-between shadow">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">{request.title}</h3>
              <p className="text-xs text-primary-100">Ticket #{request.id} • Live Discussion</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat message history */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No messages yet. Send a message to coordinate with the tenant/staff directly!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[11px] font-semibold text-gray-600">{msg.sender_name}</span>
                    {getRoleBadge(msg.sender_role)}
                    <span className="text-[10px] text-gray-400">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
                      isMine
                        ? 'bg-primary-600 text-white rounded-tr-none'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message (e.g. When will technician visit?)..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="bg-primary-600 text-white p-2.5 rounded-xl hover:bg-primary-700 disabled:opacity-40 transition shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}

