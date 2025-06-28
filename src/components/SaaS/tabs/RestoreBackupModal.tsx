import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { BackupRecord } from '../../../types/saas'
import LoadingSpinner from '../../ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface RestoreBackupModalProps {
  backup: BackupRecord | null
  visible: boolean
  onClose: () => void
  onRestore: (backupId: string) => void
}

export function RestoreBackupModal({
  backup,
  visible,
  onClose,
  onRestore,
}: RestoreBackupModalProps) {
  const [loading, setLoading] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  if (!backup || !visible) return null

  const handleRestore = async () => {
    if (confirmText !== backup.table_name) {
      toast.error('Please type the table name correctly to confirm')
      return
    }

    setLoading(true)
    try {
      onRestore(backup.id)
      toast.success('Backup restoration started')
      onClose()
    } catch (error) {
      toast.error('Failed to restore backup')
      console.error('Restore error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-xl shadow-xl w-full max-w-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Restore Backup</h3>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-yellow-500/10 text-yellow-400 p-4 rounded-lg mb-6">
          <ExclamationTriangleIcon className="w-6 h-6 mb-2" />
          <p className="text-sm">
            Warning: This action will restore data from the backup and overwrite current data.
            This action cannot be undone.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="space-y-1">
            <p className="text-white/60">Backup Details:</p>
            <ul className="text-white space-y-1">
              <li>Created: {new Date(backup.created_at).toLocaleString()}</li>
              <li>Size: {(backup.backup_size / 1024 / 1024).toFixed(2)} MB</li>
              <li>Type: {backup.backup_type}</li>
              <li>Tables: {backup.table_name}</li>
              <li>Records: {
                Object.entries(backup.backup_data || {}).reduce((total, [_, data]) => 
                  total + (Array.isArray(data) ? data.length : 0), 0)
              }</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Type "{backup.table_name}" to confirm restore
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={backup.table_name}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white/60 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleRestore}
            disabled={loading || confirmText !== backup.table_name}
            className={`glass-button px-4 py-2 hover-glow flex items-center space-x-2 bg-yellow-500/20 text-yellow-400 ${
              loading || confirmText !== backup.table_name ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <LoadingSpinner className="w-4 h-4" />
            ) : (
              <ArrowPathIcon className="w-4 h-4" />
            )}
            <span>Restore Backup</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
} 