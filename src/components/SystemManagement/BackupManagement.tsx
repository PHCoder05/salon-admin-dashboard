import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { BackupRecord } from '../../types/saas'
import LoadingSpinner from '../ui/LoadingSpinner'
import { CloudArrowDownIcon, FolderIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function BackupManagement() {
  const { data: backups, isLoading } = useQuery<BackupRecord[]>({
    queryKey: ['backups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })

  const downloadBackup = async (backup: BackupRecord) => {
    try {
      // For local backups, we'll create a zip of the files
      if (backup.backup_type === 'local' || backup.backup_type === 'both') {
        const response = await fetch('/api/backups/download/' + backup.id)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup_${backup.table_name}_${new Date(backup.created_at).toISOString().split('T')[0]}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
      
      // For cloud backups, we'll download the JSON data
      if (backup.backup_type === 'cloud' || backup.backup_type === 'both') {
        const blob = new Blob([JSON.stringify(backup.backup_data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup_${backup.table_name}_${new Date(backup.created_at).toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }

      toast.success('Backup downloaded successfully')
    } catch (error) {
      console.error('Error downloading backup:', error)
      toast.error('Failed to download backup')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  const totalBackupSize = backups?.reduce((sum, backup) => sum + (backup.backup_size || 0), 0) || 0
  const successfulBackups = backups?.filter(b => b.status === 'completed').length || 0
  const failedBackups = backups?.filter(b => b.status === 'failed').length || 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white">Total Storage</h3>
          <p className="text-2xl font-bold text-blue-400">{(totalBackupSize / 1024 / 1024).toFixed(2)} MB</p>
          <p className="text-sm text-white/60">Used by backups</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white">Successful Backups</h3>
          <p className="text-2xl font-bold text-green-400">{successfulBackups}</p>
          <p className="text-sm text-white/60">Completed successfully</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white">Failed Backups</h3>
          <p className="text-2xl font-bold text-red-400">{failedBackups}</p>
          <p className="text-sm text-white/60">Need attention</p>
        </motion.div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Backup History</h3>
        <div className="space-y-4">
          {backups?.map((backup, index) => (
            <motion.div
              key={backup.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
            >
              <div className="flex-1">
                <h4 className="text-white font-medium">{backup.table_name}</h4>
                <p className="text-sm text-white/60">
                  {new Date(backup.created_at).toLocaleString()} • {(backup.backup_size / 1024 / 1024).toFixed(2)} MB
                </p>
                <div className="flex items-center mt-1">
                  {backup.backup_type === 'cloud' && <CloudArrowDownIcon className="w-4 h-4 text-blue-400 mr-1" />}
                  {backup.backup_type === 'local' && <FolderIcon className="w-4 h-4 text-purple-400 mr-1" />}
                  {backup.backup_type === 'both' && (
                    <>
                      <CloudArrowDownIcon className="w-4 h-4 text-blue-400 mr-1" />
                      <FolderIcon className="w-4 h-4 text-purple-400 mr-1" />
                    </>
                  )}
                  <span className={`text-sm ${backup.status === 'completed' ? 'text-green-400' : 'text-red-400'}`}>
                    {backup.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadBackup(backup)}
                  className="px-3 py-1 text-sm text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                  Download
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
} 