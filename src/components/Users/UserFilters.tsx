import { motion } from 'framer-motion'
import { FunnelIcon } from '@heroicons/react/24/outline'
import { ProfileFilters } from '../../types/profiles'

interface Props {
  filters: ProfileFilters
  onChange: (filters: ProfileFilters) => void
}

export default function UserFilters({ filters, onChange }: Props) {
  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'salon_owner', label: 'Salon Owner' },
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'stylist', label: 'Stylist' },
  ]

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
  ]

  const handleFilterChange = (key: keyof Omit<ProfileFilters, 'dateRange'>, value: string) => {
    onChange({ ...filters, [key]: value })
  }

  const handleDateRangeChange = (value: string) => {
    let dateRange;
    const now = new Date();
    
    switch (value) {
      case 'today':
        dateRange = {
          start: new Date(now.setHours(0, 0, 0, 0)),
          end: new Date(now.setHours(23, 59, 59, 999))
        }
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        dateRange = {
          start: weekStart,
          end: new Date(now)
        }
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateRange = {
          start: monthStart,
          end: new Date(now)
        }
        break;
      case 'quarter':
        const quarterStart = new Date(now);
        quarterStart.setMonth(Math.floor(now.getMonth() / 3) * 3, 1);
        dateRange = {
          start: quarterStart,
          end: new Date(now)
        }
        break;
      default:
        dateRange = undefined;
    }
    
    onChange({ ...filters, dateRange })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card p-4"
    >
      <div className="flex items-center space-x-2 mb-4">
        <FunnelIcon className="w-5 h-5 text-white/60" />
        <h3 className="text-white font-medium">Filters</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white/60 mb-2">Role</label>
          <select
            value={filters.role || 'all'}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="glass-input w-full"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-2">Status</label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="glass-input w-full"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-2">Joined</label>
          <select
            value={filters.dateRange ? 'custom' : 'all'}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            className="glass-input w-full"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onChange({ role: 'all', status: 'all', dateRange: undefined })}
          className="w-full glass text-white/80 hover:text-white hover:bg-white/5 py-2 rounded-lg transition-colors text-sm"
        >
          Clear Filters
        </button>
      </div>
    </motion.div>
  )
} 