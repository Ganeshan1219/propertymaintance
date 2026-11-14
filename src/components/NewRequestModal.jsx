import { useState } from 'react'
import { X, Image as ImageIcon, Sparkles } from 'lucide-react'
import { api, useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const categories = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'general', label: 'General' },
  { value: 'structural', label: 'Structural' },
  { value: 'appliance', label: 'Appliance' },
]

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const titleSuggestions = [
  'Leaking kitchen sink',
  'Toilet running continuously',
  'Shower faucet leaking',
  'Water pressure is low',
  'Burst pipe under sink',
  'Clogged bathroom drain',
  'Water heater not working',
  'Bathroom sink drain blocked',
  'Bedroom light not working',
  'Ceiling fan making noise',
  'Power outlet not working',
  'Flickering hallway lights',
  'Switch not responding',
  'GFCI outlet tripping',
  'Main breaker keeps tripping',
  'Outdoor light not turning on',
  'AC not cooling properly',
  'Heater not turning on',
  'Weak airflow from vents',
  'Thermostat not working',
  'Air conditioner leaking water',
  'Strange noise from AC unit',
  'Cooling system not working',
  'Room too hot despite AC running',
  'Door lock sticking',
  'Front door needs repair',
  'Window cannot close properly',
  'Cracked bathroom tiles',
  'Cabinet handle loose',
  'Pest issue in kitchen',
  'Water stain on ceiling',
  'Wall paint peeling',
]

const samplePhotos = [
  { label: '💧 Water Leak', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400' },
  { label: '❄️ AC Unit', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400' },
  { label: '⚡ Electrical', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400' },
  { label: '🚪 Broken Fixture', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400' },
]

export default function NewRequestModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    image_url: '',
  })
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filteredSuggestions = form.title.trim()
    ? titleSuggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(form.title.trim().toLowerCase())
      )
    : titleSuggestions

  if (!isOpen) return null

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be under 2MB')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, image_url: reader.result }))
      toast.success('Photo attached!')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    const propertyId = user?.property_id ?? form.property_id ?? 1
    setLoading(true)
    try {
      await api.post('/api/maintenance', { ...form, property_id: Number(propertyId) })
      toast.success('Maintenance request created with real-time tracking!')
      setForm({ title: '', description: '', category: 'general', priority: 'medium', image_url: '' })
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 border-b pb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">New Maintenance Request</h2>
            <p className="text-xs text-gray-500">Attach photos & details for rapid ≤48hr SLA dispatch</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title *</label>
            <div className="relative">
              <input
                type="text"
                value={form.title}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onChange={(e) => {
                  setForm({ ...form, title: e.target.value })
                  setShowSuggestions(true)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="e.g., Leaking kitchen sink under cabinet"
              />

              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                  {filteredSuggestions.slice(0, 15).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setForm({ ...form, title: suggestion })
                        setShowSuggestions(false)
                      }}
                      className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
              placeholder="Describe the issue in detail (location, behavior, severity)..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium"
              >
                {priorities.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Photo Attachment Section (Feature 1) */}
          <div className="border border-dashed border-gray-300 rounded-xl p-3 bg-gray-50/60">
            <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-primary-600" />
              Attach Photo of Issue (Feature #1)
            </label>

            <div className="flex items-center gap-2 mb-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
              />
            </div>

            <div className="text-xs text-gray-400 mb-1">Or choose a preset sample photo:</div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {samplePhotos.map(sample => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => setForm({ ...form, image_url: sample.url })}
                  className="px-2 py-0.5 text-xs bg-white border border-gray-200 rounded-full hover:border-primary-400 hover:text-primary-600 transition"
                >
                  {sample.label}
                </button>
              ))}
            </div>

            {form.image_url && (
              <div className="relative mt-2 inline-block">
                <img
                  src={form.image_url}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image_url: '' })}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition shadow"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
