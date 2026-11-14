import { useState, useEffect } from 'react'
import { Loader2, CalendarDays, Clock, XCircle, LogIn, LogOut as LogOutIcon, QrCode } from 'lucide-react'
import { useAuth, api } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import AmenityCard from '../components/AmenityCard'
import BookingModal from '../components/BookingModal'
import DigitalPassModal from '../components/DigitalPassModal'
import toast from 'react-hot-toast'

export default function Amenities() {
  const { user } = useAuth()
  const socket = useSocket()
  const [amenities, setAmenities] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('amenities')
  const [selectedAmenity, setSelectedAmenity] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [activePassBooking, setActivePassBooking] = useState(null)

  const fetchAmenities = async () => {
    try {
      const res = await api.get('/api/amenities')
      setAmenities(res.data.amenities || res.data)
    } catch (err) {
      toast.error('Failed to load amenities')
    }
  }

  const fetchBookings = async () => {
    try {
      const res = await api.get('/api/bookings')
      setBookings(res.data.bookings || res.data)
    } catch (err) {
      toast.error('Failed to load bookings')
    }
  }

  useEffect(() => {
    Promise.all([fetchAmenities(), fetchBookings()]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!socket) return
    const handleBookingEvent = () => {
      fetchBookings()
    }
    socket.on('booking:created', handleBookingEvent)
    socket.on('booking:updated', handleBookingEvent)
    return () => {
      socket.off('booking:created', handleBookingEvent)
      socket.off('booking:updated', handleBookingEvent)
    }
  }, [socket])

  const handleBook = (amenity) => {
    setSelectedAmenity(amenity)
    setModalOpen(true)
  }

  const handleCheckin = async (bookingId) => {
    try {
      await api.patch(`/api/bookings/${bookingId}/checkin`)
      toast.success('Checked in successfully!')
      fetchBookings()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-in failed')
    }
  }

  const handleCheckout = async (bookingId) => {
    try {
      await api.patch(`/api/bookings/${bookingId}/checkout`)
      toast.success('Checked out successfully!')
      fetchBookings()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-out failed')
    }
  }

  const handleCancel = async (bookingId) => {
    try {
      await api.patch(`/api/bookings/${bookingId}/cancel`)
      toast.success('Booking cancelled')
      fetchBookings()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cancel failed')
    }
  }

  const bookingStatusColors = {
    confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    checked_in: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    checked_out: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  }

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
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Amenities & Facility Access</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Browse, reserve conflict-free slots & generate instant Smart Digital Passes
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 gap-1 border border-gray-200 dark:border-gray-700 w-fit">
        <button
          onClick={() => setActiveTab('amenities')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'amenities'
              ? 'bg-white dark:bg-gray-900 text-primary-700 dark:text-primary-300 shadow-sm'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          Available Amenities ({amenities.length})
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'bookings'
              ? 'bg-white dark:bg-gray-900 text-primary-700 dark:text-primary-300 shadow-sm'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          My Bookings ({bookings.length})
        </button>
      </div>

      {/* Amenities Grid */}
      {activeTab === 'amenities' && (
        <>
          {amenities.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-8">
              <p className="text-gray-400 text-sm">No amenities available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {amenities.map((amenity, idx) => (
                <AmenityCard key={amenity.id} amenity={amenity} onBook={handleBook} index={idx} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Bookings List */}
      {activeTab === 'bookings' && (
        <>
          {bookings.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-8">
              <p className="text-gray-400 text-sm mb-3">You haven't reserved any amenities yet.</p>
              <button
                onClick={() => setActiveTab('amenities')}
                className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition"
              >
                Browse & Book Amenities Now
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amenity</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time Slot</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Digital Pass</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition">
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                          {booking.amenity_name || `Amenity #${booking.amenity_id}`}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-1.5 font-medium">
                            <CalendarDays className="w-4 h-4 text-primary-500" />
                            {booking.booking_date}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-4 h-4 text-primary-500" />
                            {booking.check_in_time} - {booking.check_out_time}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${bookingStatusColors[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                            {booking.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setActivePassBooking(booking)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition border border-indigo-200 dark:border-indigo-800"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            View Smart Pass
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {booking.status === 'confirmed' && (
                              <>
                                <button
                                  onClick={() => handleCheckin(booking.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-100 transition"
                                  title="Check In"
                                >
                                  <LogIn className="w-3.5 h-3.5" />
                                  Check In
                                </button>
                                <button
                                  onClick={() => handleCancel(booking.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded-lg text-xs font-bold hover:bg-red-100 transition"
                                  title="Cancel"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Cancel
                                </button>
                              </>
                            )}
                            {booking.status === 'checked_in' && (
                              <button
                                onClick={() => handleCheckout(booking.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
                                title="Check Out"
                              >
                                <LogOutIcon className="w-3.5 h-3.5" />
                                Check Out
                              </button>
                            )}
                            {(booking.status === 'checked_out' || booking.status === 'cancelled') && (
                              <span className="text-xs text-gray-400 font-medium">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Booking Form Modal */}
      <BookingModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedAmenity(null) }}
        amenity={selectedAmenity}
        onSuccess={() => { fetchBookings(); fetchAmenities() }}
      />

      {/* Digital Pass Modal */}
      <DigitalPassModal
        isOpen={!!activePassBooking}
        onClose={() => setActivePassBooking(null)}
        booking={activePassBooking}
        onUpdate={() => fetchBookings()}
      />
    </div>
  )
}
