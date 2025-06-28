import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../../lib/supabase'
import LoadingSpinner from '../../ui/LoadingSpinner'
import toast from 'react-hot-toast'
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

interface SchemaViewModalProps {
  tableName: string
  onClose: () => void
}

export function SchemaViewModal({ tableName, onClose }: SchemaViewModalProps) {
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRow, setEditingRow] = useState<any | null>(null)
  const [newRow, setNewRow] = useState<any | null>(null)

  useEffect(() => {
    fetchTableData()
    fetchTableColumns()
  }, [tableName])

  const fetchTableData = async () => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(100)

      if (error) throw error
      setData(data)
    } catch (error) {
      toast.error('Failed to fetch table data')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTableColumns = async () => {
    try {
      const { data: columnsData, error } = await supabase
        .rpc('get_table_columns', { table_name: tableName })

      if (error) throw error
      setColumns(columnsData)
    } catch (error) {
      toast.error('Failed to fetch table columns')
      console.error('Error:', error)
    }
  }

  const handleEdit = (row: any) => {
    setEditingRow({ ...row })
  }

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from(tableName)
        .update(editingRow)
        .eq('id', editingRow.id)

      if (error) throw error
      toast.success('Row updated successfully')
      fetchTableData()
      setEditingRow(null)
    } catch (error) {
      toast.error('Failed to update row')
      console.error('Error:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this row?')) return

    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Row deleted successfully')
      fetchTableData()
    } catch (error) {
      toast.error('Failed to delete row')
      console.error('Error:', error)
    }
  }

  const handleAdd = () => {
    const emptyRow = columns.reduce((acc, col) => {
      acc[col.column_name] = ''
      return acc
    }, {})
    setNewRow(emptyRow)
  }

  const handleSaveNew = async () => {
    try {
      const { error } = await supabase
        .from(tableName)
        .insert(newRow)

      if (error) throw error
      toast.success('Row added successfully')
      fetchTableData()
      setNewRow(null)
    } catch (error) {
      toast.error('Failed to add row')
      console.error('Error:', error)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900/90 p-8 rounded-xl">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{tableName} Schema</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add New Row</span>
          </button>
          
          <button
            onClick={fetchTableData}
            className="px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5">
                {columns.map((col) => (
                  <th key={col.column_name} className="px-4 py-2 text-left text-white/60">
                    {col.column_name}
                  </th>
                ))}
                <th className="px-4 py-2 text-left text-white/60">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {newRow && (
                <tr className="bg-green-500/10">
                  {columns.map((col) => (
                    <td key={col.column_name} className="px-4 py-2">
                      <input
                        type="text"
                        value={newRow[col.column_name] || ''}
                        onChange={(e) => setNewRow({
                          ...newRow,
                          [col.column_name]: e.target.value
                        })}
                        className="w-full bg-black/20 border border-white/20 rounded px-2 py-1 text-white"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSaveNew}
                        className="p-2 text-green-400 hover:bg-green-500/20 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setNewRow(null)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-white/5">
                  {columns.map((col) => (
                    <td key={col.column_name} className="px-4 py-2">
                      {editingRow?.id === row.id ? (
                        <input
                          type="text"
                          value={editingRow[col.column_name] || ''}
                          onChange={(e) => setEditingRow({
                            ...editingRow,
                            [col.column_name]: e.target.value
                          })}
                          className="w-full bg-black/20 border border-white/20 rounded px-2 py-1 text-white"
                        />
                      ) : (
                        <span className="text-white">{row[col.column_name]}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-2">
                    <div className="flex items-center space-x-2">
                      {editingRow?.id === row.id ? (
                        <>
                          <button
                            onClick={handleSave}
                            className="p-2 text-green-400 hover:bg-green-500/20 rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingRow(null)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(row)}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
} 