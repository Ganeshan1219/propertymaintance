import { useState, useEffect } from 'react'
import { X, UserPlus, Shield, Car, CheckCircle, Clock, KeyRound } from 'lucide-react'
import { api, useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import toast from 'react-hot-toast'

export default function VisitorsModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const socket = useSocket()
  const [visitors, setVisitors] = useState([])
  const [visitorName, setVisitorName] = useState('')
  const [vehicleNo, setVehicleNo] = useState('')
  const [purpose, setPurpose] = useState('Personal Guest')
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const fetchVisitors = async () => {
    try {
      const res = await api.get('/api/community/visitors')
      setVisitors(res.data.visitors || [])
    } catch (err) {
      console.error('Failed to load visitors:', err)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchVisitors()
    }
    if (socket) {
      const refresh = () => fetchVisitors()
      socket.on('visitor:created', refresh)
      socket.on('visitor:updated', refresh)
      return () => {
        socket.off('visitor:created', refresh)
        socket.off('visitor:updated', refresh)
      }
    }
  }, [isOpen, socket])

  if (!isOpen) return null

  const handleCreatePass = async (e) => {
    e.preventDefault()
    if (!visitorName.trim()) return
    setLoading(true)
    try {
      const res = await api.post('/api/community/visitors', {
        visitor_name: visitorName,
        vehicle_no: vehicleNo,
        purpose
      })
      toast.success(`Visitor Pass Created! Entry PIN: ${res.data.visitor.entry_code}`)
      setVisitorName('')
      setVehicleNo('')
      setShowAddForm(false)
      fetchVisitors()
    } catch (err) {
      toast.error('Failed to create visitor pass')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/api/community/visitors/${id}/status`, { status })
      toast.success(`Visitor status marked as ${status.replace('_', ' ')}`)
      fetchVisitors()
    } catch (err) {
      toast.error('Failed to update visitor status')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">Gated Community Security & Visitor Passes</h3>
              <p className="text-[11px] text-slate-300">Pre-approve guests & verify entry OTP at security gate</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Add Pass Button */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition shadow flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> Pre-Approve New Visitor (Generate Entry PIN)
            </button>
          ) : (
            <form onSubmit={handleCreatePass} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border space-y-3">
              <h4 className="font-bold text-xs text-gray-800 dark:text-white">New Visitor Details</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Visitor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={visitorName}
                    onChange={e => setVisitorName(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs outline-none bg-white dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Vehicle Plate # (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. TN-01-AB-1234"
                    value={vehicleNo}
                    onChange={e => setVehicleNo(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs outline-none bg-white dark:bg-gray-700 dark:text-white uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Purpose of Visit</label>
                <select
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg text-xs outline-none bg-white dark:bg-gray-700 dark:text-white"
                >
                  <option value="Personal Guest">Personal Guest / Family</option>
                  <option value="Food Delivery">Food Delivery (Swiggy/Zomato)</option>
                  <option value="Courier / Package">Courier / Amazon / Flipkart</option>
                  <option value="Home Service">Home Service / Technician</option>
                  <option value="Cab / Taxi">Cab / Taxi Pickup</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-1 text-xs text-gray-500">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700">
                  Generate Pass & Entry PIN
                </button>
              </div>
            </form>
          )}

          {/* Visitor Passes List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active & Recent Visitor Passes</h4>
            {visitors.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-xs">No visitor passes registered yet.</p>
            ) : (
              visitors.map((v) => (
                <div key={v.id} className="p-3.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-gray-900 dark:text-white">{v.visitor_name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold capitalize">
                        {v.purpose}
                      </span>
                      {v.vehicle_no && v.vehicle_no !== 'None' && (
                        <span className="text-[10px] flex items-center gap-1 font-mono text-gray-500 dark:text-gray-400">
                          <Car className="w-3 h-3" /> {v.vehicle_no}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">Visit Date: {v.visit_date}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Entry OTP / PIN */}
                    <div className="text-center px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl">
                      <span className="block text-[9px] uppercase font-bold text-amber-700 dark:text-amber-400">Entry PIN</span>
                      <span className="font-mono font-black text-sm text-amber-900 dark:text-amber-200 tracking-wider flex items-center gap-0.5">
                        <KeyRound className="w-3 h-3" /> {v.entry_code}
                      </span>
                    </div>

                    {/* Status & Actions */}
                    <div>
                      {v.status === 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(v.id, 'checked_in')}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100"
                        >
                          Gate In
                        </button>
                      )}
                      {v.status === 'checked_in' && (
                        <button
                          onClick={() => handleUpdateStatus(v.id, 'checked_out')}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100"
                        >
                          Gate Out
                        </button>
                      )}
                      {v.status === 'checked_out' && (
                        <span className="text-[11px] text-gray-400 font-semibold">Exited ✅</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

