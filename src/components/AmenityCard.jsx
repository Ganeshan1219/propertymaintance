import { Users } from 'lucide-react'

const gradients = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-pink-600',
  'from-purple-500 to-violet-600',
  'from-cyan-500 to-blue-600',
  'from-rose-500 to-red-600',
]

export default function AmenityCard({ amenity, index, onBook }) {
  const gradient = gradients[index % gradients.length]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm overflow-hidden card-hover border border-gray-100 dark:border-gray-800 transition-colors">
      {/* Image / Gradient Banner */}
      <div className={`h-40 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
        {amenity.image_url ? (
          <img src={amenity.image_url} alt={amenity.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white/80 text-5xl font-black">{amenity.name.charAt(0)}</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        <span className="absolute bottom-3 left-4 text-white font-extrabold text-base tracking-wide drop-shadow">
          {amenity.name}
        </span>
      </div>

      <div className="p-5">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
          {amenity.description || 'Community shared amenity available for residents.'}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4 pt-1 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1.5 font-semibold">
            <Users className="w-4 h-4 text-primary-500" />
            <span>Capacity: {amenity.capacity} pax</span>
          </div>
          <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full">
            Available
          </span>
        </div>

        <button
          onClick={() => onBook(amenity)}
          className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-bold transition shadow"
        >
          Reserve Slot
        </button>
      </div>
    </div>
  )
}
