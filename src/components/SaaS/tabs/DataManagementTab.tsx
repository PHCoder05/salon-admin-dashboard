import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import LoadingSpinner from '../../ui/LoadingSpinner'
import { SchemaViewModal } from './SchemaViewModal'
import toast from 'react-hot-toast'
import { createLocalBackupFolder } from '../../../utils/exportUtils'
import { CloudArrowDownIcon, FolderIcon } from '@heroicons/react/24/outline'
import { PostgrestError } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'

interface DataStats {
  total_records: number
  storage_used: number
  last_backup: string
  data_types: string[]
}

interface BackupOptions {
  includeCloud: boolean
  includeLocal: boolean
}

export function DataManagementTab() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const navigate = useNavigate()

  const { data: stats, isLoading, refetch } = useQuery<DataStats>({
    queryKey: ['dataStats'],
    queryFn: async () => {
      // Get table sizes and stats
      const { data: tableStats, error: statsError } = await supabase
        .rpc('get_table_stats')

      if (statsError) throw statsError

      // Get latest backup info
      const { data: backups, error: backupError } = await supabase
        .from('backups')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)

      if (backupError) throw backupError

      return {
        total_records: tableStats.total_rows || 0,
        storage_used: tableStats.total_size || 0,
        last_backup: backups?.[0]?.created_at || 'No backups found',
        data_types: tableStats.table_names || []
      }
    }
  })

  const handleBackup = async (tableName: string, options: BackupOptions = { includeCloud: true, includeLocal: true }) => {
    setIsBackingUp(true)
    let localBackupPaths: string[] = []
    let backupType = options.includeCloud && options.includeLocal ? 'both' : (options.includeCloud ? 'cloud' : 'local')

    try {
      // Fetch table data
      const { data: tableData, error: fetchError } = await supabase
        .from(tableName)
        .select('*')

      if (fetchError) {
        throw new Error(`Failed to fetch data from ${tableName}: ${fetchError.message}`)
      }

      if (!tableData || !Array.isArray(tableData)) {
        throw new Error(`Invalid data received from ${tableName}`)
      }

      // Create local backup if requested
      if (options.includeLocal) {
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const folderName = `${tableName}_backup_${timestamp}`
          
          const folderPath = await createLocalBackupFolder(tableName, tableData)
          
          if (folderPath) {
            localBackupPaths = [
              `${folderPath}/${tableName}.xlsx`,
              `${folderPath}/${tableName}.sql`
            ]
            toast.success(`Local backup created in folder: ${folderPath}`)
          } else {
            toast.success('Backup files downloaded successfully')
          }
        } catch (localError) {
          console.error('Local backup error:', localError)
          toast.error('Local backup failed, but continuing with cloud backup')
        }
      }

      // Create cloud backup if requested
      if (options.includeCloud) {
        const { error: backupError } = await supabase
          .from('backups')
          .insert({
            table_name: tableName,
            backup_data: tableData,
            file_paths: localBackupPaths,
            backup_type: backupType,
            backup_size: new TextEncoder().encode(JSON.stringify(tableData)).length,
            created_at: new Date().toISOString(),
            status: 'completed'
          })

        if (backupError) {
          throw new Error(`Failed to create cloud backup: ${backupError.message}`)
        }

        toast.success('Cloud backup created successfully')
      }

      refetch() // Refresh the stats to show new backup time
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      // Log failed backup in database if cloud backup was requested
      if (options.includeCloud) {
        try {
          const { error: logError } = await supabase
            .from('backups')
            .insert({
              table_name: tableName,
              backup_data: null,
              file_paths: localBackupPaths,
              backup_type: backupType,
              created_at: new Date().toISOString(),
              status: 'failed',
              error_message: errorMessage
            })

          if (logError) {
            console.error('Failed to log backup failure:', logError)
          } else {
            console.log('Failure logged in backups table')
          }
        } catch (logError) {
          console.error('Failed to log backup failure:', logError)
        }
      }

      toast.error(errorMessage)
      console.error('Backup error:', error)
    } finally {
      setIsBackingUp(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  const storageInMB = stats ? (stats.storage_used / 1024 / 1024).toFixed(2) : '0.00'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white">Total Records</h3>
          <p className="text-2xl font-bold text-blue-400">{stats?.total_records.toLocaleString()}</p>
          <p className="text-sm text-white/60">Across all tables</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white">Storage Used</h3>
          <p className="text-2xl font-bold text-green-400">{storageInMB} MB</p>
          <p className="text-sm text-white/60">Total database size</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => navigate('/system-management', { state: { activeTab: 'backup' } })}
        >
          <h3 className="text-lg font-semibold text-white">Last Backup</h3>
          <p className="text-2xl font-bold text-purple-400">
            {new Date(stats?.last_backup || '').toLocaleDateString()}
          </p>
          <p className="text-sm text-white/60">Click to view backup details</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white">Data Types</h3>
          <p className="text-2xl font-bold text-yellow-400">{stats?.data_types.length || 0}</p>
          <p className="text-sm text-white/60">Different tables</p>
        </motion.div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Data Structure</h3>
        <div className="space-y-4">
          {stats?.data_types.map((table, index) => (
            <motion.div
              key={table}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
            >
              <span className="text-white font-medium">{table}</span>
              <div className="flex items-center space-x-2">
                <button
                  className="px-3 py-1 text-sm text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors duration-200"
                  onClick={() => setSelectedTable(table)}
                >
                  View Schema
                </button>
                <button
                  className="px-3 py-1 text-sm text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  onClick={() => handleBackup(table)}
                  disabled={isBackingUp}
                >
                  <CloudArrowDownIcon className="w-4 h-4" />
                  <FolderIcon className="w-4 h-4 ml-1" />
                  <span>{isBackingUp ? 'Backing up...' : 'Full Backup'}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {selectedTable && (
        <SchemaViewModal
          tableName={selectedTable}
          onClose={() => setSelectedTable(null)}
        />
      )}
    </div>
  )
} 