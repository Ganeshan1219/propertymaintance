import { TrendingUp, TrendingDown } from 'lucide-react'

const colorMap = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
  yellow: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
  red: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-300',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-300',
}

export default function StatsCard({ icon: Icon, title, value, color = 'blue', trend }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm p-6 card-hover border border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(trend)}% from last month</span>
            </div>
          )}
        </div>
        <div className={`p-3.5 rounded-2xl ${colorMap[color] || colorMap.blue}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}
