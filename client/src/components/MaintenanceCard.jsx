import { useState } from 'react'
import { Wrench, Clock, User, MessageSquare, Star, AlertTriangle, ShieldAlert, CheckCircle, ExternalLink, IndianRupee, Receipt } from 'lucide-react'
import { api } from '../context/AuthContext'
import toast from 'react-hot-toast'
import MaintenanceChatModal from './MaintenanceChatModal'
import RatingModal from './RatingModal'

const priorityColors = {
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
}

const statusLabels = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
}

const categoryIcons = {
  plumbing: '🔧',
  electrical: '⚡',
  hvac: '❄️',
  general: '🔨',
  structural: '🏗️',
  appliance: '🔌',
}

export default function MaintenanceCard({ request, userRole, onUpdate }) {
  const [showChat, setShowChat] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [costInput, setCostInput] = useState(request.cost || '')
  const [costDetailsInput, setCostDetailsInput] = useState(request.cost_details || '')

  const handleStatusChange = async (newStatus, customCost, customDetails) => {
    try {
      await api.patch(`/api/maintenance/${request.id}/status`, {
        status: newStatus,
        cost: customCost !== undefined ? customCost : request.cost,
        cost_details: customDetails !== undefined ? customDetails : request.cost_details,
      })
      toast.success(`Status updated to ${statusLabels[newStatus]}`)
      setShowCompleteModal(false)
      if (onUpdate) onUpdate()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status')
    }
  }

  const createdDate = new Date(request.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  // SLA Calculation (Target <= 48 Hours)
  const calculateSLA = () => {
    if (request.status === 'completed') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-md">
          <CheckCircle className="w-3 h-3" /> Resolved within SLA
        </span>
      )
    }

    const createdTime = new Date(request.created_at).getTime()
    const elapsedHours = (Date.now() - createdTime) / (1000 * 60 * 60)
    const remainingHours = Math.max(0, 48 - elapsedHours).toFixed(1)

    if (elapsedHours >= 48) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-black text-red-700 bg-red-100 dark:bg-red-950/60 dark:text-red-300 px-2 py-0.5 rounded-md animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5" /> 🚨 SLA BREACHED ({Math.round(elapsedHours)}h elapsed)
        </span>
      )
    } else if (elapsedHours >= 24) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-md">
          <AlertTriangle className="w-3.5 h-3.5" /> ⚠️ SLA WARNING ({remainingHours}h remaining)
        </span>
      )
    } else {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-0.5 rounded-md">
          <Clock className="w-3 h-3" /> SLA Active: {remainingHours}h left
        </span>
      )
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm hover:shadow-md transition-all p-5 border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
        <div>
          {/* Header & Badges */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{categoryIcons[request.category] || '🔨'}</span>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-sm line-clamp-1">{request.title}</h3>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColors[request.status]}`}>
              {statusLabels[request.status]}
            </span>
          </div>

          {/* SLA Badge */}
          <div className="mb-3">
            {calculateSLA()}
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-2 leading-relaxed">
            {request.description || 'No description provided.'}
          </p>

          {/* Photo Attachment Preview */}
          {request.image_url && (
            <div className="mb-3">
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                className="group relative block w-full h-28 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <img
                  src={request.image_url}
                  alt={request.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                  <ExternalLink className="w-3.5 h-3.5" /> View Photo Evidence
                </div>
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-[11px] font-medium capitalize">
              {request.category}
            </span>
            <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold capitalize ${priorityColors[request.priority]}`}>
              {request.priority} priority
            </span>
          </div>

          {/* Feature #2: Expense / Cost Log */}
          {Number(request.cost) > 0 && (
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-2.5 mb-3 text-xs flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                <Receipt className="w-3.5 h-3.5" />
                <span>Expense Logged: ₹{request.cost}</span>
              </div>
              {request.cost_details && (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium italic truncate max-w-[50%]">
                  "{request.cost_details}"
                </span>
              )}
            </div>
          )}

          {/* Star Rating Display */}
          {request.rating && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-2.5 mb-3 text-xs">
              <div className="flex items-center gap-1 font-bold text-amber-800 dark:text-amber-300">
                <span className="flex text-amber-500">
                  {Array.from({ length: request.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </span>
                <span>({request.rating}/5)</span>
              </div>
              {request.feedback && (
                <p className="text-[11px] text-amber-900 dark:text-amber-200 mt-0.5 italic">"{request.feedback}"</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-gray-400 mb-3 pt-1 border-t border-gray-50 dark:border-gray-800">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{createdDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{request.tenant_name || 'Tenant'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setShowChat(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition border border-gray-200 dark:border-gray-700"
          >
            <MessageSquare className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            Live Chat with {userRole === 'tenant' ? 'Staff' : 'Tenant'}
          </button>

          {userRole === 'tenant' && request.status === 'completed' && !request.rating && (
            <button
              onClick={() => setShowRating(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 rounded-xl text-xs font-bold transition border border-amber-200 dark:border-amber-800"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              Rate Maintenance Service
            </button>
          )}

          {(userRole === 'owner' || userRole === 'staff') && request.status !== 'completed' && (
            <div className="flex gap-2">
              {request.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange('in_progress')}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                >
                  Start Work
                </button>
              )}
              <button
                onClick={() => setShowCompleteModal(true)}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
              >
                Mark Complete & Bill
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Completion & Expense Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowCompleteModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-800 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">Complete Request & Log Expense</h4>
              <button onClick={() => setShowCompleteModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <Clock className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Parts & Labor Expense (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  placeholder="0"
                  value={costInput}
                  onChange={e => setCostInput(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border rounded-xl text-xs font-bold outline-none bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Parts Replaced / Details
              </label>
              <input
                type="text"
                placeholder="e.g. Copper valve replaced"
                value={costDetailsInput}
                onChange={e => setCostDetailsInput(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 py-2 border rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('completed', costInput, costDetailsInput)}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
              >
                Confirm Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      <MaintenanceChatModal
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        request={request}
      />

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRating}
        onClose={() => setShowRating(false)}
        request={request}
        onSuccess={() => onUpdate && onUpdate()}
      />

      {/* Full Photo Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowPhotoModal(false)}>
          <div className="max-w-xl max-h-[85vh] bg-white rounded-2xl overflow-hidden p-2" onClick={e => e.stopPropagation()}>
            <img src={request.image_url} alt={request.title} className="w-full h-auto max-h-[75vh] object-contain rounded-xl" />
            <div className="p-3 text-center">
              <p className="text-xs font-semibold text-gray-700">{request.title} (Photo Proof)</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
