import { X, QrCode, Calendar, Clock, MapPin, CheckCircle, ShieldCheck } from 'lucide-react'
import { api } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function DigitalPassModal({ isOpen, onClose, booking, onUpdate }) {
  if (!isOpen || !booking) return null

  const handleCheckIn = async () => {
    try {
      await api.patch(`/api/bookings/${booking.id}/checkin`)
      toast.success('Successfully Checked In! Enjoy your amenity slot.')
      onUpdate?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-in failed')
    }
  }

  const handleCheckOut = async () => {
    try {
      await api.patch(`/api/bookings/${booking.id}/checkout`)
      toast.success('Successfully Checked Out! Slot is now freed.')
      onUpdate?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-out failed')
    }
  }

  // QR Code encoded data URL
  const qrData = encodeURIComponent(
    `PASS:BOOKING-${booking.id}|AMENITY:${booking.amenity_name}|DATE:${booking.booking_date}|SLOT:${booking.check_in_time}-${booking.check_out_time}`
  )
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}&color=1d4ed8`

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pass Header */}
        <div className="bg-gradient-to-r from-primary-600 to-indigo-700 text-white p-5 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="inline-flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Feature #4: Digital Smart Pass
          </div>
          <h2 className="text-xl font-extrabold">{booking.amenity_name}</h2>
          <p className="text-xs text-primary-100 flex items-center justify-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5" /> Sunrise Residences Club
          </p>
        </div>

        {/* Perforated divider visual */}
        <div className="relative bg-white flex items-center justify-between px-3 -my-3 z-10">
          <div className="w-6 h-6 rounded-full bg-black/60 -ml-6"></div>
          <div className="border-b-2 border-dashed border-gray-200 w-full mx-2"></div>
          <div className="w-6 h-6 rounded-full bg-black/60 -mr-6"></div>
        </div>

        {/* Pass Body with QR Code */}
        <div className="p-6 text-center space-y-4">
          <div className="inline-block p-3 bg-primary-50/70 border border-primary-200 rounded-2xl shadow-inner">
            <img
              src={qrCodeUrl}
              alt="Access QR Code"
              className="w-40 h-40 object-contain mx-auto rounded-lg"
            />
            <p className="text-[10px] font-mono text-primary-800 mt-1.5 font-bold tracking-widest">
              PASS #BOOK-{String(booking.id).padStart(4, '0')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left bg-gray-50 p-3.5 rounded-2xl text-xs">
            <div>
              <span className="text-gray-400 block text-[10px] font-semibold uppercase">Date</span>
              <span className="font-bold text-gray-800 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-primary-600" /> {booking.booking_date}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] font-semibold uppercase">Slot Timing</span>
              <span className="font-bold text-gray-800 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-primary-600" /> {booking.check_in_time} - {booking.check_out_time}
              </span>
            </div>
            <div className="col-span-2 pt-2 border-t border-gray-200 flex justify-between items-center">
              <span className="text-gray-400 text-[10px] font-semibold uppercase">Status</span>
              <span className="capitalize font-bold text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {booking.status}
              </span>
            </div>
          </div>

          {/* Quick Action Inside Pass */}
          <div className="pt-1">
            {booking.status === 'confirmed' && (
              <button
                onClick={handleCheckIn}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> Scan & Check In Now
              </button>
            )}
            {booking.status === 'checked_in' && (
              <button
                onClick={handleCheckOut}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> Finished: Check Out Now
              </button>
            )}
            {booking.status === 'checked_out' && (
              <div className="text-xs text-gray-400 font-semibold py-1">
                Completed & Verified ✅
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

