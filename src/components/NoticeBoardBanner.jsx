import { useState, useEffect } from 'react'
import { Megaphone, AlertCircle, Plus, X, Calendar, Bell } from 'lucide-react'
import { api, useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import toast from 'react-hot-toast'

export default function NoticeBoardBanner() {
  const { user } = useAuth()
  const socket = useSocket()
  const [notices, setNotices] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newPriority, setNewPriority] = useState('normal')

  const fetchNotices = async () => {
    try {
      const res = await api.get('/api/community/notices')
      setNotices(res.data.notices || [])
    } catch (err) {
      console.error('Failed to load notices:', err)
    }
  }

  useEffect(() => {
    fetchNotices()
    if (socket) {
      const handleNotice = (newNotice) => {
        setNotices(prev => [newNotice, ...prev])
        toast((t) => (
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="text-xs font-bold text-gray-900">New Community Notice</p>
              <p className="text-xs text-gray-600">{newNotice.title}</p>
            </div>
          </div>
        ))
      }
      socket.on('community:notice', handleNotice)
      return () => socket.off('community:notice', handleNotice)
    }
  }, [socket])

  const handleCreateNotice = async (e) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) return
    try {
      await api.post('/api/community/notices', {
        title: newTitle,
        content: newContent,
        priority: newPriority
      })
      toast.success('Notice published to community board!')
      setNewTitle('')
      setNewContent('')
      setShowCreate(false)
      fetchNotices()
    } catch (err) {
      toast.error('Failed to publish notice')
    }
  }

  const latestNotice = notices[0]

  if (!latestNotice) return null

  return (
    <>
      <div className="bg-gradient-to-r from-indigo-500/10 via-primary-500/10 to-purple-500/10 border-b border-indigo-100 dark:border-indigo-900/30">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider bg-indigo-600 text-white shrink-0">
              <Megaphone className="w-3 h-3" /> Community Notice
            </span>
            {latestNotice.priority === 'urgent' && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase shrink-0 animate-pulse">
                Urgent
              </span>
            )}
            <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
              {latestNotice.title} — <span className="font-normal text-gray-500 dark:text-gray-400">{latestNotice.content}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowModal(true)}
              className="text-primary-600 hover:text-primary-800 dark:text-primary-400 font-bold underline text-xs"
            >
              View All ({notices.length})
            </button>
            {(user?.role === 'owner' || user?.role === 'staff') && (
              <button
                onClick={() => { setShowModal(true); setShowCreate(true) }}
                className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-indigo-200 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-lg font-bold text-[11px] hover:bg-indigo-50 transition shadow-sm"
              >
                <Plus className="w-3 h-3" /> Post Notice
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notice Board Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                <h3 className="font-bold text-sm">Community Notice Board</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/20 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Post Notice Form for Owner / Staff */}
            {(user?.role === 'owner' || user?.role === 'staff') && showCreate && (
              <form onSubmit={handleCreateNotice} className="p-4 bg-indigo-50/60 dark:bg-gray-800/80 border-b border-indigo-100 dark:border-gray-700 space-y-2">
                <h4 className="font-bold text-xs text-indigo-900 dark:text-indigo-200">Publish New Announcement</h4>
                <input
                  type="text"
                  placeholder="Notice Title (e.g. Generator Testing)"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs outline-none bg-white dark:bg-gray-700 dark:text-white"
                />
                <textarea
                  placeholder="Detailed announcement content..."
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs outline-none bg-white dark:bg-gray-700 dark:text-white resize-none"
                />
                <div className="flex justify-between items-center pt-1">
                  <div className="flex gap-2 text-xs">
                    <label className="flex items-center gap-1 text-gray-700 dark:text-gray-300 cursor-pointer">
                      <input type="radio" checked={newPriority === 'normal'} onChange={() => setNewPriority('normal')} /> Normal
                    </label>
                    <label className="flex items-center gap-1 text-red-600 font-bold cursor-pointer">
                      <input type="radio" checked={newPriority === 'urgent'} onChange={() => setNewPriority('urgent')} /> Urgent Alert
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowCreate(false)} className="text-xs text-gray-500 hover:text-gray-700 px-2">Cancel</button>
                    <button type="submit" className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-indigo-700">Publish</button>
                  </div>
                </div>
              </form>
            )}

            {/* Notices List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {(user?.role === 'owner' || user?.role === 'staff') && !showCreate && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="w-full py-2 bg-indigo-50 dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold border border-dashed border-indigo-300 hover:bg-indigo-100 transition mb-2"
                >
                  + Add New Community Announcement
                </button>
              )}

              {notices.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-2xl border transition ${
                    n.priority === 'urgent'
                      ? 'border-red-200 bg-red-50/60 dark:bg-red-950/20 dark:border-red-900/50'
                      : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                      {n.priority === 'urgent' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{n.content}</p>
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-[10px] text-gray-400 font-medium">
                    Published by: {n.created_by}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

