import { useState } from 'react'
import { X, Flame, AlertOctagon, Zap, HeartPulse, ShieldAlert, AlertTriangle } from 'lucide-react'
import { api, useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const emergencyTypes = [
  { id: 'gas_leak', label: '🔥 Gas Leakage', icon: Flame, color: 'border-orange-500 bg-orange-50 text-orange-700' },
  { id: 'fire', label: '🚨 Fire Alarm / Smoke', icon: AlertOctagon, color: 'border-red-500 bg-red-50 text-red-700' },
  { id: 'lift_stuck', label: '🛗 Elevator / Lift Stuck', icon: ShieldAlert, color: 'border-yellow-500 bg-yellow-50 text-yellow-700' },
  { id: 'medical', label: '🏥 Medical Emergency', icon: HeartPulse, color: 'border-rose-500 bg-rose-50 text-rose-700' },
  { id: 'electrical_spark', label: '⚡ Electric Short Circuit', icon: Zap, color: 'border-amber-500 bg-amber-50 text-amber-700' },
  { id: 'other', label: '⚠️ Other Urgent Crisis', icon: AlertTriangle, color: 'border-gray-500 bg-gray-50 text-gray-700' },
]

export default function EmergencySOSModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const [selectedType, setSelectedType] = useState('gas_leak')
  const [description, setDescription] = useState('')
  const [unit, setUnit] = useState('Unit 302')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleTriggerSOS = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/api/community/emergency', {
        type: selectedType,
        description: description || `Emergency ${selectedType.replace('_', ' ')} reported at ${unit}`,
        unit
      })
      toast.success('🚨 EMERGENCY SOS BROADCASTED! Security & Staff dispatched immediately.')
      onClose()
    } catch (err) {
      toast.error('Failed to broadcast SOS')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-red-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-red-500 animate-in fade-in zoom-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-red-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl animate-pulse">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide uppercase">Emergency SOS Dispatch</h2>
              <p className="text-xs text-red-100">Broadcasts instant high-priority alert to staff & management</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleTriggerSOS} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Select Emergency Category</label>
            <div className="grid grid-cols-2 gap-2">
              {emergencyTypes.map((t) => {
                const Icon = t.icon
                const isSelected = selectedType === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedType(t.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition text-xs font-bold ${
                      isSelected
                        ? `${t.color} border-2 shadow-sm ring-1 ring-red-400`
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Your Flat / Unit #</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. Flat 401"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Reporter</label>
              <input
                type="text"
                disabled
                value={user?.name || 'Tenant'}
                className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Emergency Notes (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Provide immediate context (e.g. Smell of cooking gas in kitchen, main valve turned off)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-lg shadow-red-500/30 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4 animate-bounce" />
              {loading ? 'Transmitting...' : 'Send SOS Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

