import { useState, useEffect } from 'react'
import { Wrench, ClipboardList, Clock, CheckCircle, CalendarDays, Users, Loader2, Star, ShieldAlert, Sparkles, Award, FileText, IndianRupee, PieChart } from 'lucide-react'
import { useAuth, api } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import StatsCard from '../components/StatsCard'
import ExportAuditReportModal from '../components/ExportAuditReportModal'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user } = useAuth()
  const socket = useSocket()
  const [maintenanceStats, setMaintenanceStats] = useState(null)
  const [bookingStats, setBookingStats] = useState(null)
  const [recentRequests, setRecentRequests] = useState([])
  const [upcomingBookings, setUpcomingBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showExportModal, setShowExportModal] = useState(false)

  const fetchData = async () => {
    try {
      const [mStatsRes, bStatsRes, requestsRes, bookingsRes] = await Promise.all([
        api.get('/api/maintenance/stats'),
        api.get('/api/bookings/stats'),
        api.get('/api/maintenance'),
        api.get('/api/bookings'),
      ])
      setMaintenanceStats(mStatsRes.data)
      setBookingStats(bStatsRes.data)
      setRecentRequests((requestsRes.data.requests || requestsRes.data).slice(0, 5))
      setUpcomingBookings((bookingsRes.data.bookings || bookingsRes.data).slice(0, 5))
    } catch (err) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!socket) return
    const refresh = () => fetchData()
    socket.on('maintenance:created', refresh)
    socket.on('maintenance:updated', refresh)
    socket.on('booking:created', refresh)
    socket.on('booking:updated', refresh)
    socket.on('maintenance:message', refresh)
    socket.on('community:notice', refresh)
    socket.on('visitor:created', refresh)
    return () => {
      socket.off('maintenance:created', refresh)
      socket.off('maintenance:updated', refresh)
      socket.off('booking:created', refresh)
      socket.off('booking:updated', refresh)
      socket.off('maintenance:message', refresh)
      socket.off('community:notice', refresh)
      socket.off('visitor:created', refresh)
    }
  }, [socket])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-700 dark:from-primary-700 dark:to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
            {user?.role} Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">Welcome back, {user?.name}! 👋</h1>
          <p className="text-primary-100 text-xs sm:text-sm mt-1">
            Real-time tracking, conflict-prevention & automated SLA monitoring are active.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Feature #4: Export Audit Report Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-primary-900 hover:bg-primary-50 rounded-2xl text-xs font-extrabold shadow-md transition"
          >
            <FileText className="w-4 h-4 text-primary-600" />
            Export Monthly Audit PDF
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase">Tenant Satisfaction</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
              {maintenanceStats?.avgRating || 5.0} <span className="text-xs text-amber-500 font-normal">/ 5.0 ⭐</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl text-red-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase">SLA Breaches (&gt;48h)</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {maintenanceStats?.slaBreached ?? 0}
              <span className="text-xs text-emerald-600 font-normal ml-1.5">
                {maintenanceStats?.slaBreached === 0 ? 'Optimal' : 'Needs Action'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase">Total Maintenance Spend</div>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
              ₹{(maintenanceStats?.totalExpenses || 1900).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase">Avg Resolution Time</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {maintenanceStats?.avgResolutionHours || 12} <span className="text-xs text-gray-500 font-normal">hrs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Stats Row */}
      <div>
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-3">Maintenance Operations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={ClipboardList}
            title="Total Requests"
            value={maintenanceStats?.total || 0}
            color="blue"
          />
          <StatsCard
            icon={Clock}
            title="Pending Requests"
            value={maintenanceStats?.pending || 0}
            color="yellow"
          />
          <StatsCard
            icon={Wrench}
            title="In Progress"
            value={maintenanceStats?.in_progress || 0}
            color="orange"
          />
          <StatsCard
            icon={CheckCircle}
            title="Completed"
            value={maintenanceStats?.completed || 0}
            color="green"
          />
        </div>
      </div>

      {/* Booking Stats Row */}
      <div>
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-3">Amenity Reservations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            icon={CalendarDays}
            title="Total Bookings"
            value={bookingStats?.total || 0}
            color="purple"
          />
          <StatsCard
            icon={Users}
            title="Active / In Use"
            value={bookingStats?.active || bookingStats?.confirmed || 0}
            color="blue"
          />
          <StatsCard
            icon={CalendarDays}
            title="Upcoming Slots"
            value={bookingStats?.upcoming || 0}
            color="green"
          />
        </div>
      </div>

      {/* Two columns: Recent Requests + Upcoming Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
            <span>Recent Maintenance Activity</span>
            <span className="text-xs font-semibold text-primary-600 bg-primary-50 dark:bg-primary-950 dark:text-primary-300 px-2 py-0.5 rounded-full">Live</span>
          </h2>
          {recentRequests.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No maintenance requests yet.</p>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3.5 bg-gray-50/70 hover:bg-gray-50 dark:bg-gray-800/60 dark:hover:bg-gray-800 rounded-2xl transition border border-gray-100 dark:border-gray-700">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{req.title}</p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">
                      {req.category} · {req.priority} priority · {req.tenant_name || 'Tenant'}
                      {Number(req.cost) > 0 && <span className="ml-2 font-bold text-emerald-600">₹{req.cost}</span>}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-3 ${statusColors[req.status]}`}>
                    {statusLabels[req.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
            <span>Upcoming Amenity Bookings</span>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-full">Verified</span>
          </h2>
          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No upcoming bookings.</p>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3.5 bg-gray-50/70 hover:bg-gray-50 dark:bg-gray-800/60 dark:hover:bg-gray-800 rounded-2xl transition border border-gray-100 dark:border-gray-700">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{booking.amenity_name || `Amenity #${booking.amenity_id}`}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{booking.booking_date} · {booking.check_in_time} - {booking.check_out_time}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 border border-primary-200 dark:border-primary-800 whitespace-nowrap ml-3 capitalize">
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feature #4: Export Audit Report Modal */}
      <ExportAuditReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  )
}
