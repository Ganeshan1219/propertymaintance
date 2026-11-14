import { useState, useEffect } from 'react'
import { Plus, Search, Loader2 } from 'lucide-react'
import { useAuth, api } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import MaintenanceCard from '../components/MaintenanceCard'
import NewRequestModal from '../components/NewRequestModal'
import toast from 'react-hot-toast'

const tabs = [
  { key: 'all', label: 'All Requests' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
]

export default function Maintenance() {
  const { user } = useAuth()
  const socket = useSocket()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const fetchRequests = async () => {
    try {
      const res = await api.get('/api/maintenance')
      setRequests(res.data.requests || res.data)
    } catch (err) {
      toast.error('Failed to load maintenance requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  useEffect(() => {
    if (!socket) return
    const handleCreated = (data) => {
      setRequests((prev) => [data, ...prev])
    }
    const handleUpdated = (data) => {
      setRequests((prev) =>
        prev.map((r) => (r.id === data.id ? { ...r, ...data } : r))
      )
    }
    socket.on('maintenance:created', handleCreated)
    socket.on('maintenance:updated', handleUpdated)
    return () => {
      socket.off('maintenance:created', handleCreated)
      socket.off('maintenance:updated', handleUpdated)
    }
  }, [socket])

  const filtered = requests
    .filter((r) => activeTab === 'all' || r.status === activeTab)
    .filter(
      (r) =>
        !search ||
        r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase()) ||
        r.category?.toLowerCase().includes(search.toLowerCase())
    )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Maintenance Operations & SLA Dispatch</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Real-time tracking, SLA countdowns, direct staff chat & photo audit
          </p>
        </div>
        {user?.role === 'tenant' && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-bold transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            + Raise Maintenance Request
          </button>
        )}
      </div>

      {/* Controls: Search & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 gap-1 border border-gray-200 dark:border-gray-700 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-900 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets, category, tags..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Requests Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-8">
          <p className="text-gray-400 text-sm">No maintenance requests found matching your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((request) => (
            <MaintenanceCard
              key={request.id}
              request={request}
              userRole={user?.role}
              onUpdate={fetchRequests}
            />
          ))}
        </div>
      )}

      {/* New Request Modal */}
      <NewRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchRequests}
      />
    </div>
  )
}
