import React from 'react'
import { Modal, Descriptions, Tag, Space } from 'antd'
import { BackupRecord } from '../../../types/saas'

export interface ClientBackupDetailsProps {
  backup: BackupRecord
  visible: boolean
  onClose: () => void
}

export const ClientBackupDetails: React.FC<ClientBackupDetailsProps> = ({
  backup,
  visible,
  onClose,
}) => {
  if (!visible) return null

  return (
    <Modal
      title="Backup Details"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="ID">{backup.id}</Descriptions.Item>
        <Descriptions.Item label="Created By">{backup.created_by || 'All Users'}</Descriptions.Item>
        <Descriptions.Item label="Type">
          <Tag color={backup.backup_type === 'full' ? 'green' : 'blue'}>
            {backup.backup_type.toUpperCase()}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={backup.status === 'completed' ? 'success' : backup.status === 'in_progress' ? 'processing' : 'error'}>
            {backup.status.toUpperCase()}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {new Date(backup.created_at).toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="Completed At">
          {backup.completed_at ? new Date(backup.completed_at).toLocaleString() : 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Size">
          {backup.backup_size ? `${(backup.backup_size / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Tables">
          <Space wrap>
            {(backup.table_name || '').split(',').map((table: string) => (
              table && <Tag key={table} color="blue">{table.trim()}</Tag>
            ))}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Backup Data" span={2}>
          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
            {Object.entries(backup.backup_data || {}).map(([table, data]) => (
              <div key={table} className="mb-2">
                <strong>{table}:</strong> {Array.isArray(data) ? `${data.length} records` : 'No data'}
              </div>
            ))}
          </div>
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  )
} 