import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarIcon,
  ClockIcon,
  CloudIcon,
  ComputerDesktopIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { BackupSchedule } from '../../../types/saas'
import LoadingSpinner from '../../ui/LoadingSpinner'
import toast from 'react-hot-toast'
import BackupService from '../../../services/backupService'

interface ScheduleBackupModalProps {
  clientId?: string
  visible: boolean
  onClose: () => void
}

export function ScheduleBackupModal({
  clientId,
  visible,
  onClose,
}: ScheduleBackupModalProps) {
  const [loading, setLoading] = useState(false)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [time, setTime] = useState('00:00')
  const [backupType, setBackupType] = useState<'full' | 'incremental' | 'differential'>('full')
  const [storageType, setStorageType] = useState<'cloud' | 'local' | 'both'>('cloud')

  if (!visible) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const backupService = BackupService.getInstance()
      const schedule: BackupSchedule = {
        id: '', // Will be set by the server
        client_id: clientId,
        frequency,
        backup_options: {
          type: backupType,
          compression: true,
          encryption: true,
          storageType,
        },
        next_run: calculateNextRun(frequency, time),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: true,
      }

      await backupService.updateBackupSchedule(clientId || '', schedule)
      toast.success('Backup schedule updated')
      onClose()
    } catch (error) {
      toast.error('Failed to update backup schedule')
      console.error('Schedule error:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateNextRun = (frequency: string, time: string): string => {
    const now = new Date()
    const [hours, minutes] = time.split(':').map(Number)
    const next = new Date(now)
    next.setHours(hours, minutes, 0, 0)

    if (next <= now) {
      switch (frequency) {
        case 'daily':
          next.setDate(next.getDate() + 1)
          break
        case 'weekly':
          next.setDate(next.getDate() + 7)
          break
        case 'monthly':
          next.setMonth(next.getMonth() + 1)
          break
      }
    }

    return next.toISOString()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-xl shadow-xl w-full max-w-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Schedule Backup</h3>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Backup Type
            </label>
            <select
              value={backupType}
              onChange={(e) => setBackupType(e.target.value as 'full' | 'incremental' | 'differential')}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="full">Full Backup</option>
              <option value="incremental">Incremental Backup</option>
              <option value="differential">Differential Backup</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Storage Type
            </label>
            <select
              value={storageType}
              onChange={(e) => setStorageType(e.target.value as 'cloud' | 'local' | 'both')}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cloud">Cloud Storage</option>
              <option value="local">Local Storage</option>
              <option value="both">Both Cloud & Local</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5" />
                <span>Frequency</span>
              </div>
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-5 h-5" />
                <span>Time</span>
              </div>
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white/60 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="glass-button px-4 py-2 hover-glow flex items-center space-x-2"
            >
              {loading ? (
                <LoadingSpinner className="w-4 h-4" />
              ) : (
                <CalendarIcon className="w-4 h-4" />
              )}
              <span>Save Schedule</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
} 