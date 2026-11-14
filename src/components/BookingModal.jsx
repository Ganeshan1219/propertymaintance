import { useState } from 'react'
import { X, Calendar, Clock } from 'lucide-react'
import { api } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function BookingModal({ isOpen, onClose, amenity, onSuccess }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    booking_date: today,
    check_in_time: '09:00',
    check_out_time: '10:00',
  })
  const [loading, setLoading] = useState(false)

  if (!isOpen || !amenity) return null

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (form.check_out_time <= form.check_in_time) {
      toast.error('Check-out time must be after check-in time')
      return
    }

    setLoading(true)
    try {
      await api.post('/api/bookings', {
        amenity_id: amenity.id,
        booking_date: form.booking_date,
        check_in_time: form.check_in_time,
        check_out_time: form.check_out_time,
      })
      toast.success(`Booked ${amenity.name} successfully!`)
      onSuccess?.()
      onClose()
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Time slot conflict! Please choose a different time.')
      } else {
        toast.error(err.response?.data?.error || 'Failed to create booking')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Book {amenity.name}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Reserve your conflict-free time slot</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              <Calendar className="w-4 h-4 text-primary-500" />
              Reservation Date
            </label>
            <input
              type="date"
              min={today}
              value={form.booking_date}
              onChange={(e) => setForm({ ...form, booking_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                <Clock className="w-4 h-4 text-primary-500" />
                Check-in Time
              </label>
              <input
                type="time"
                value={form.check_in_time}
                onChange={(e) => setForm({ ...form, check_in_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                <Clock className="w-4 h-4 text-primary-500" />
                Check-out Time
              </label>
              <input
                type="time"
                value={form.check_out_time}
                onChange={(e) => setForm({ ...form, check_out_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 disabled:opacity-50 shadow"
            >
              {loading ? 'Validating Slot...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
