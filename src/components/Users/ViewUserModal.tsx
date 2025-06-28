import { motion } from 'framer-motion'
import { XMarkIcon, UserIcon, EnvelopeIcon, PhoneIcon, CalendarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'suspended'
  lastLogin: string
  joinedAt: string
  avatar?: string
}

interface ViewUserModalProps {
  isOpen: boolean
  user: User | null
  onClose: () => void
  onEdit: (user: User) => void
}

export default function ViewUserModal({ isOpen, user, onClose, onEdit }: ViewUserModalProps) {
  if (!isOpen || !user) return null

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'salon_owner':
        return 'text-purple-400 bg-purple-500/20 border-purple-500/30'
      case 'admin':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30'
      case 'manager':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30'
      case 'stylist':
        return 'text-green-400 bg-green-500/20 border-green-500/30'
      default:
        return 'text-white/60 bg-white/10 border-white/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'inactive':
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
      case 'suspended':
        return 'text-red-400 bg-red-500/20 border-red-500/30'
      default:
        return 'text-white/60 bg-white/10 border-white/20'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-full max-w-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">User Details</h2>
            <p className="text-white/60 text-sm">View user profile information</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </motion.button>
        </div>

        {/* User Avatar and Basic Info */}
        <div className="flex items-center space-x-6 mb-8 p-6 bg-white/5 rounded-2xl border border-white/10">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <span className="text-white text-2xl font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">{user.name}</h3>
            <p className="text-white/60 mb-3">{user.email}</p>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 text-sm rounded-full border ${getRoleColor(user.role)}`}>
                {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <span className={`px-3 py-1 text-sm rounded-full border ${getStatusColor(user.status)}`}>
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* User Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white/90 border-b border-white/10 pb-2">
              Contact Information
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <EnvelopeIcon className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-white/60 text-sm">Email Address</p>
                  <p className="text-white">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <PhoneIcon className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white/60 text-sm">Phone Number</p>
                  <p className="text-white">Not provided</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white/90 border-b border-white/10 pb-2">
              Account Information
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <CalendarIcon className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-white/60 text-sm">Member Since</p>
                  <p className="text-white">{new Date(user.joinedAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <CalendarIcon className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-white/60 text-sm">Last Login</p>
                  <p className="text-white">{new Date(user.lastLogin).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <ShieldCheckIcon className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white/60 text-sm">Role</p>
                  <p className="text-white">{user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-4 pt-6 border-t border-white/10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl transition-all duration-200 border border-white/20"
          >
            Close
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onEdit(user)
              onClose()
            }}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25"
          >
            Edit User
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
} 