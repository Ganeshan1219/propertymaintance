import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Building2, LayoutDashboard, Wrench, CalendarDays, LogOut, Menu, X, Sun, Moon, ShieldAlert, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import EmergencySOSModal from './EmergencySOSModal'
import VisitorsModal from './VisitorsModal'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/amenities', label: 'Amenities', icon: CalendarDays },
]

const roleBadgeColors = {
  tenant: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  staff: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showSOS, setShowSOS] = useState(false)
  const [showVisitors, setShowVisitors] = useState(false)

  return (
    <>
      <nav className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-black text-xl">
              <Building2 className="w-7 h-7" />
              <span>PropManager</span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1.5">
              {navLinks.map(({ to, label, icon: Icon }) => {
                const isActive = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50/70 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </Link>
                )
              })}

              {/* Visitor Pass Quick Access */}
              <button
                type="button"
                onClick={() => setShowVisitors(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
              >
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Visitor Passes</span>
              </button>
            </div>

            {/* Action buttons & User profile */}
            <div className="hidden md:flex items-center gap-2.5">
              {/* Emergency SOS Button */}
              <button
                type="button"
                onClick={() => setShowSOS(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition animate-pulse"
                title="Trigger Emergency SOS"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>SOS Alert</span>
              </button>

              {/* Dark / Light Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
                title="Toggle Theme"
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1"></div>

              {/* User badge */}
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user?.name}</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${roleBadgeColors[user?.role] || 'bg-slate-100 text-slate-700'}`}>
                  {user?.role}
                </span>
              </div>

              {/* Logout */}
              <button
                type="button"
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-1.5 md:hidden">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              </button>
              <button
                type="button"
                onClick={() => setShowSOS(true)}
                className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold"
              >
                SOS
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 rounded-lg"
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-2">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold ${
                  location.pathname === to
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}
            <button
              type="button"
              onClick={() => { setMobileOpen(false); setShowVisitors(true); }}
              className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 w-full text-left"
            >
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Visitor Passes</span>
            </button>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900 dark:text-white">{user?.name} ({user?.role})</span>
              <button onClick={logout} className="text-xs text-red-600 font-bold">Logout</button>
            </div>
          </div>
        )}
      </nav>

      {/* Modals */}
      <EmergencySOSModal isOpen={showSOS} onClose={() => setShowSOS(false)} />
      <VisitorsModal isOpen={showVisitors} onClose={() => setShowVisitors(false)} />
    </>
  )
}
