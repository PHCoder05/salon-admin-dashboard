import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  UsersIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

import { ProfileService } from '../../../services/profileService'
import { Profile, ProfileFilters } from '../../../types/profiles'
import UserStats from '../../Users/UserStats'
import UserFilters from '../../Users/UserFilters'
import CreateUserModal from '../../Users/CreateUserModal'
import ViewUserModal from '../../Users/ViewUserModal'
import EditUserModal from '../../Users/EditUserModal'

// This interface is now for UI purposes
interface User {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'suspended'
  lastLogin: string
  joinedAt: string
  avatar?: string
  phone?: string
  whatsapp?: string
}

const profileToUser = (profile: Profile): User => ({
  id: profile.id,
  name: profile.full_name || profile.username || 'Unknown',
  email: profile.email || 'No email provided',
  role: profile.role || 'user',
  status: profile.is_active ? 'active' : 'inactive',
  lastLogin: profile.updated_at || profile.created_at,
  joinedAt: profile.created_at,
  avatar: profile.avatar_url,
  phone: profile.phone_number,
  whatsapp: profile.whatsapp_number
})

const fetchUsers = async (filters: ProfileFilters) => {
  try {
    const [profiles, stats] = await Promise.all([
      ProfileService.getProfiles(filters),
      ProfileService.getProfileStats()
    ]);
    
    const users = profiles.map(profileToUser);
    return { 
      users, 
      stats: {
        ...stats,
        totalUsers: stats.totalProfiles,
        activeUsers: stats.activeProfiles,
        inactiveUsers: stats.inactiveProfiles,
        newUsers: stats.newThisMonth,
        growthRate: stats.growthRate,
        roleDistribution: stats.roleDistribution || {}
      }
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export function ClientManagementTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<ProfileFilters>({
    role: 'all',
    status: 'all',
    dateRange: undefined
  })
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['users', filters, searchTerm],
    queryFn: () => fetchUsers({ role: filters.role, status: filters.status, search: searchTerm }),
  })

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => ProfileService.deleteProfile(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deleted successfully!')
    },
    onError: (error: any) => {
      toast.error(`Failed to delete user: ${error.message}`)
    }
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (email: string) => ProfileService.resetPassword(email),
    onSuccess: (result) => {
      toast.success(result.message)
    },
    onError: (error: any) => {
      toast.error(`Failed to reset password: ${error.message}`)
    }
  })

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(userId)
    }
  }

  const handleResetPassword = (user: User) => {
    if (!user.email) {
      toast.error('Cannot reset password: No email address found')
      return
    }
    if (confirm('Are you sure you want to send a password reset email to this user?')) {
      resetPasswordMutation.mutate(user.email)
    }
  }

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setIsViewModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] })
    setSelectedUser(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20'
      case 'inactive': return 'text-gray-400 bg-gray-500/20'
      case 'suspended': return 'text-red-400 bg-red-500/20'
      default: return 'text-white/60 bg-white/10'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'salon_owner': return 'text-purple-400 bg-purple-500/20'
      case 'admin': return 'text-blue-400 bg-blue-500/20'
      case 'manager': return 'text-orange-400 bg-orange-500/20'
      case 'stylist': return 'text-green-400 bg-green-500/20'
      default: return 'text-white/60 bg-white/10'
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header is now part of the main page, so we only need stats and below */}
      
      <UserStats data={data?.stats} isLoading={isLoading} />

      {/* Search and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card p-4"
          >
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
                  placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-3"
                />
              </div>
              <button className="glass-button p-3 hover-glow">
                <FunnelIcon className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-1">
          <UserFilters filters={filters} onChange={setFilters} />
        </div>
      </div>

      {/* Users Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-card p-6"
          >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">All Client Profiles</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-white/60">
              <UsersIcon className="w-5 h-5" />
              <span>{data?.users?.length || 0} users</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreateModalOpen(true)}
              className="glass-button px-4 py-2 hover-glow flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add User</span>
            </motion.button>
          </div>
            </div>
            
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-white/5 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white/60 text-sm border-b border-white/10">
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Last Login</th>
                  <th className="p-4 font-medium">Joined</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data?.users?.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                          ) : (
                            <span className="text-purple-400 font-medium">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-white font-medium">{user.name}</div>
                          <div className="text-white/60 text-sm">{user.email}</div>
                          {user.phone && (
                            <div className="text-white/40 text-xs">📞 {user.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-white/60">
                      <div className="text-sm">
                        {new Date(user.lastLogin).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-white/40">
                        {new Date(user.lastLogin).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-4 text-white/60">
                      <div className="text-sm">
                        {new Date(user.joinedAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-white/40">
                        {new Date(user.joinedAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
      </div>
        )}
      </motion.div>

      {/* Modals */}
      <CreateUserModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={handleCreateSuccess} />
      <ViewUserModal isOpen={isViewModalOpen} user={selectedUser} onClose={() => setIsViewModalOpen(false)} onEdit={handleEditUser} />
      <EditUserModal isOpen={isEditModalOpen} user={selectedUser} onClose={() => setIsEditModalOpen(false)} onSuccess={handleEditSuccess} />
    </div>
  )
} 