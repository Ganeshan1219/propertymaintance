import { useState } from 'react'
import { X, Star } from 'lucide-react'
import { api } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function RatingModal({ isOpen, onClose, request, onSuccess }) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen || !request) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post(`/api/maintenance/${request.id}/rate`, {
        rating,
        feedback
      })
      toast.success('Thank you for rating our service!')
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit rating')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
            Feature #3: Quality Audit
          </span>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mt-2">Rate Maintenance Service</h3>
        <p className="text-xs text-gray-500 mt-1 mb-4">
          How satisfied were you with the resolution for <br />
          <strong className="text-gray-700 font-semibold">"{request.title}"</strong>?
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Interactive 5 Stars */}
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = hoverRating ? star <= hoverRating : star <= rating
              return (
                <button
                  type="button"
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      active
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              )
            })}
          </div>
          <div className="text-xs font-semibold text-amber-600">
            {rating === 5 && '🌟 Excellent Service (5/5)'}
            {rating === 4 && '👍 Very Good (4/5)'}
            {rating === 3 && '👌 Satisfactory (3/5)'}
            {rating === 2 && '👎 Needs Improvement (2/5)'}
            {rating === 1 && '⚠️ Poor Experience (1/5)'}
          </div>

          <div>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Leave short comments or notes for property owner & staff..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 shadow disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

