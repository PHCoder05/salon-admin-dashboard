import { supabase } from '../lib/supabase'
import type { BackupOptions, BackupRecord, BackupSchedule } from '../types/saas'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'

function assertBackupRecord(data: unknown): asserts data is BackupRecord {
  const record = data as any
  if (!record || typeof record !== 'object') throw new Error('Invalid backup record')
  if (!record.id || typeof record.id !== 'string') throw new Error('Invalid backup record: missing id')
  if (!record.table_name || typeof record.table_name !== 'string') throw new Error('Invalid backup record: missing table_name')
  if (!record.backup_type || !['full', 'incremental', 'differential'].includes(record.backup_type)) throw new Error('Invalid backup record: invalid backup_type')
  if (!record.status || !['in_progress', 'completed', 'failed'].includes(record.status)) throw new Error('Invalid backup record: invalid status')
  if (!record.backup_data || typeof record.backup_data !== 'object') throw new Error('Invalid backup record: missing backup_data')
  if (!Array.isArray(record.file_paths)) throw new Error('Invalid backup record: missing file_paths')
  if (typeof record.backup_size !== 'number') throw new Error('Invalid backup record: missing backup_size')
  if (!record.created_at || typeof record.created_at !== 'string') throw new Error('Invalid backup record: missing created_at')
}

function assertBackupRecordArray(data: unknown): asserts data is BackupRecord[] {
  if (!Array.isArray(data)) throw new Error('Invalid backup records: not an array')
  data.forEach(record => assertBackupRecord(record))
}

export class BackupService {
  private static instance: BackupService

  private constructor() {}

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService()
    }
    return BackupService.instance
  }

  async getClients() {
    return supabase
      .from('profiles')
      .select('id, full_name, email, phone_number, created_at, updated_at')
      .order('full_name')
  }

  async getAllBackups() {
    return supabase
      .from('backups')
      .select('*')
      .order('created_at', { ascending: false })
  }

  async getClientBackups(clientId: string) {
    const { data, error } = await supabase
      .from('backups')
      .select('*')
      .eq('created_by', clientId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Error fetching backups: ${error.message}`)
    }

    assertBackupRecordArray(data)
    return data
  }

  async getBackups(clientId?: string) {
    let query = supabase
      .from('backups')
      .select('*')
      .order('created_at', { ascending: false })

    if (clientId) {
      query = query.eq('created_by', clientId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error fetching backups: ${error.message}`)
    }

    assertBackupRecordArray(data)
    return data
  }

  async createBackup(options: BackupOptions): Promise<BackupRecord> {
    try {
      const { clientId, tables = [], compression, selectAllTables, dateRange } = options
      
      // Get list of tables to backup
      const availableTables = selectAllTables ? [
        'profiles',
        'appointments',
        'appointment_services',
        'appointment_stylists',
        'pos_orders',
        'pos_order_items',
        'members',
        'product_stock_transactions'
      ] : tables;

      const backupData: Record<string, any> = {}
      
      // Fetch data for each table
      for (const table of availableTables) {
        let query = supabase.from(table).select('*')
        
        // Add client filter if clientId is provided
        if (clientId) {
          if (table === 'profiles') {
            query = query.eq('id', clientId)
          } else {
            // For related tables, filter by user_id
            query = query.eq('user_id', clientId)
          }
        }

        // Add date range filter if provided
        if (dateRange) {
          const [startDate, endDate] = dateRange;
          if (startDate && endDate) {
            query = query.gte('created_at', startDate).lte('created_at', endDate);
          }
        }

        const { data, error } = await query
        
        if (error) {
          throw new Error(`Error fetching ${table}: ${error.message}`)
        }

        backupData[table] = data
      }

      // Create backup record
      const { data: backupRecord, error: backupError } = await supabase
        .from('backups')
        .insert({
          created_by: clientId,
          table_name: availableTables.join(','),
          backup_type: options.type,
          status: 'completed',
          backup_data: backupData,
          file_paths: [],
          backup_size: JSON.stringify(backupData).length,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (backupError) {
        throw new Error(`Error creating backup record: ${backupError.message}`)
      }

      assertBackupRecord(backupRecord)
      return backupRecord
    } catch (error) {
      throw new Error(`Error creating backup: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async restoreBackup(backupId: string): Promise<void> {
    try {
      // Get backup record
      const { data: backupRecord, error: fetchError } = await supabase
        .from('backups')
        .select('*')
        .eq('id', backupId)
        .single()

      if (fetchError) {
        throw new Error(`Error fetching backup: ${fetchError.message}`)
      }

      assertBackupRecord(backupRecord)

      // Update status to in_progress
      const { error: updateError } = await supabase
        .from('backups')
        .update({ restore_status: 'in_progress', restore_started_at: new Date().toISOString() })
        .eq('id', backupId)

      if (updateError) {
        throw new Error(`Error updating backup status: ${updateError.message}`)
      }

      // Restore each table
      for (const [table, data] of Object.entries(backupRecord.backup_data)) {
        if (Array.isArray(data) && data.length > 0) {
          // Delete existing records if it's a full backup
          if (backupRecord.backup_type === 'full' && backupRecord.created_by) {
            await supabase
              .from(table)
              .delete()
              .eq('user_id', backupRecord.created_by)
          }

          // Insert new records
          const { error: insertError } = await supabase
            .from(table)
            .upsert(data)

          if (insertError) {
            throw new Error(`Error restoring ${table}: ${insertError.message}`)
          }
        }
      }

      // Update status to completed
      const { error: completeError } = await supabase
        .from('backups')
        .update({ restore_status: 'completed' })
        .eq('id', backupId)

      if (completeError) {
        throw new Error(`Error updating backup status: ${completeError.message}`)
      }
    } catch (error) {
      // Update status to failed
      await supabase
        .from('backups')
        .update({ restore_status: 'failed', error_message: error instanceof Error ? error.message : 'Unknown error' })
        .eq('id', backupId)

      throw error
    }
  }

  async updateBackupSchedule(clientId: string, schedule: BackupSchedule): Promise<void> {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          backup_schedule: schedule,
        })
        .eq('id', clientId)

      if (error) throw error
    } catch (error) {
      console.error('Update backup schedule error:', error)
      throw error
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    const { error } = await supabase
      .from('backups')
      .delete()
      .eq('id', backupId)

    if (error) {
      throw new Error(`Error deleting backup: ${error.message}`)
    }
  }

  async getBackupDetails(backupId: string) {
    return supabase
      .from('backups')
      .select('*')
      .eq('id', backupId)
      .single()
  }
}

export default BackupService 