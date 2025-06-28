import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ClientDataService, ClientStats, ClientActivity } from '../../../services/clientDataService'
import LoadingSpinner from '../../ui/LoadingSpinner'
import { supabase } from '../../../lib/supabase'

export function SaaSOverviewTab() {
  // Fetch client stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<ClientStats>({
    queryKey: ['clientStats'],
    queryFn: () => ClientDataService.getClientStats()
  })

  // Fetch recent activity
  const { data: recentActivity, isLoading: isLoadingActivity } = useQuery<ClientActivity[]>({
    queryKey: ['recentActivity'],
    queryFn: () => ClientDataService.getRecentActivity()
  })

  const isLoading = isLoadingStats || isLoadingActivity

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <LoadingSpinner />
    </div>
  )
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white">Total Clients</h3>
          <p className="text-2xl font-bold text-blue-400">{stats?.totalClients || 0}</p>
          <p className="text-sm text-white/60">Active salon clients</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white">Monthly Revenue</h3>
          <p className="text-2xl font-bold text-green-400">${stats?.monthlyRevenue?.toLocaleString() || 0}</p>
          <p className="text-sm text-white/60">Total recurring revenue</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white">Active Sessions</h3>
          <p className="text-2xl font-bold text-purple-400">{stats?.activeSessions || 0}</p>
          <p className="text-sm text-white/60">Currently online</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white">Support Tickets</h3>
          <p className="text-2xl font-bold text-yellow-400">{stats?.openTickets || 0}</p>
          <p className="text-sm text-white/60">Open tickets</p>
        </motion.div>
      </div>
      
      {/* Recent Activity */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Client Activity</h3>
        <div className="space-y-3">
          {recentActivity?.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {client.salon_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{client.salon_name}</p>
                  <p className="text-white/60 text-sm">{client.owner_name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">${client.monthly_revenue.toLocaleString()}</p>
                <p className="text-white/60 text-sm capitalize">{client.subscription_plan}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
} 