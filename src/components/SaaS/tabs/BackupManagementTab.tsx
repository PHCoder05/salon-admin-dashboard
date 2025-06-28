import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import {
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ServerIcon,
  CogIcon,
  PlayIcon,
  CalendarIcon,
  ShieldCheckIcon,
  DocumentIcon,
  XCircleIcon,
  FolderIcon,
  TableCellsIcon,
  LockClosedIcon,
  ComputerDesktopIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { BackupRecord, BackupSchedule } from '../../../types/saas'
import { Profile } from '../../../types/profiles'
import LoadingSpinner from '../../ui/LoadingSpinner'
import BackupService from '../../../services/backupService'
import { ClientBackupDetails } from './ClientBackupDetails'
import CreateBackupModal from './CreateBackupModal'
import { RestoreBackupModal } from './RestoreBackupModal'
import { ScheduleBackupModal } from './ScheduleBackupModal'
import { Card, Button, Table, Space, Tag, Typography, Statistic, Row, Col, Select, Modal } from 'antd'
import { CloudUploadOutlined, ReloadOutlined, DeleteOutlined, ScheduleOutlined } from '@ant-design/icons'
import '../../../styles/backup-management.css'

const { Title } = Typography

const BackupManagementTab: React.FC = () => {
  const queryClient = useQueryClient()
  const [selectedClient, setSelectedClient] = useState<string | undefined>(undefined)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [restoreModalVisible, setRestoreModalVisible] = useState(false)
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null)
  const [detailsVisible, setDetailsVisible] = useState(false)

  const backupService = BackupService.getInstance()

  const { data: clients, isLoading: loadingClients } = useQuery<Profile[]>(
    ['clients'],
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone_number, created_at, updated_at')
        .returns<Profile[]>()
      if (error) {
        console.error("Error fetching profiles:", error)
        throw new Error('Failed to fetch profiles')
      }
      return data || []
    }, {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  const { data: backups = [], isLoading: loadingBackups } = useQuery<BackupRecord[], Error, BackupRecord[]>(
    ['backups', selectedClient],
    async () => {
      const result = await backupService.getBackups(selectedClient)
      return result as BackupRecord[]
    },
    {
      enabled: !loadingClients,
      refetchInterval: 5000,
    }
  )

  const stats = {
    totalBackups: backups.length,
    successfulBackups: backups.filter((b: BackupRecord) => b.status === 'completed').length,
    failedBackups: backups.filter((b: BackupRecord) => b.status === 'failed').length,
    totalSize: backups.reduce((acc: number, b: BackupRecord) => acc + (b.backup_size || 0), 0),
  }

  const handleClientChange = (value: string) => {
    setSelectedClient(value)
  }

  const deleteBackupMutation = useMutation<void, Error, string>({
    mutationFn: (backupId: string) => backupService.deleteBackup(backupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      toast.success('Backup deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete backup: ${error.message}`)
    }
  })

  const restoreBackupMutation = useMutation<void, Error, string>({
    mutationFn: (backupId: string) => backupService.restoreBackup(backupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      toast.success('Backup restored successfully')
      setRestoreModalVisible(false)
    },
    onError: (error: Error) => {
      toast.error(`Failed to restore backup: ${error.message}`)
    }
  })

  const handleDeleteBackup = (backupId: string) => {
    Modal.confirm({
      title: 'Delete Backup',
      content: 'Are you sure you want to delete this backup? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteBackupMutation.mutate(backupId)
    })
  }

  const columns = [
    {
      title: 'Client',
      dataIndex: 'created_by',
      key: 'created_by',
      render: (userId: string) => {
        const client = clients?.find((c) => c.id === userId)
        return client ? client.full_name : 'All Clients'
      },
    },
    {
      title: 'Tables',
      dataIndex: 'table_name',
      key: 'table_name',
      render: (tables: string) => (
        <Space wrap>
          {(tables || '').split(',').map((table: string) => (
            table && <Tag key={table} color="blue">{table.trim()}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'backup_type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'full' ? 'green' : type === 'incremental' ? 'blue' : 'orange'}>
          {type ? type.charAt(0).toUpperCase() + type.slice(1) : ''}
        </Tag>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'backup_size',
      key: 'size',
      render: (size: number) => {
        if (typeof size !== 'number') return 'N/A'
        const mb = size / (1024 * 1024)
        return `${mb.toFixed(2)} MB`
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'success' : status === 'in_progress' ? 'processing' : 'error'}>
          {status ? status.toUpperCase() : ''}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: BackupRecord) => (
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setSelectedBackup(record)
              setRestoreModalVisible(true)
            }}
            disabled={record.status !== 'completed'}
          >
            Restore
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            loading={deleteBackupMutation.isLoading}
            onClick={() => handleDeleteBackup(record.id)}
            disabled={record.status === 'in_progress'}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ]

  if (loadingClients) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>Backup Management</Title>
            </Col>
            <Col>
              <Space>
                <Select
                  placeholder="Filter by Client"
                  onChange={handleClientChange}
                  loading={loadingClients}
                  allowClear
                  style={{ width: 200 }}
                  onClear={() => setSelectedClient(undefined)}
                >
                  {clients && clients.map((client) => (
                    <Select.Option key={client.id} value={client.id}>
                      {client.full_name}
                    </Select.Option>
                  ))}
                </Select>
                <Button
                  type="primary"
                  icon={<CloudUploadOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                >
                  Create Backup
                </Button>
                <Button
                  icon={<ScheduleOutlined />}
                  onClick={() => setScheduleModalVisible(true)}
                >
                  Schedule Backup
                </Button>
              </Space>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic title="Total Backups" value={stats.totalBackups} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Successful Backups"
                  value={stats.successfulBackups}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Failed Backups"
                  value={stats.failedBackups}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Size"
                  value={(stats.totalSize / (1024 * 1024)).toFixed(2)}
                  suffix="MB"
                />
              </Card>
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={backups}
            loading={loadingBackups}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Space>
      </Card>

      <CreateBackupModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
      />

      <RestoreBackupModal
        visible={restoreModalVisible}
        onClose={() => setRestoreModalVisible(false)}
        backup={selectedBackup}
        onRestore={(backupId) => restoreBackupMutation.mutate(backupId)}
      />

        <ScheduleBackupModal
        visible={scheduleModalVisible}
        onClose={() => setScheduleModalVisible(false)}
        clientId={selectedClient}
      />

      {selectedBackup && (
        <ClientBackupDetails
          backup={selectedBackup}
          visible={detailsVisible}
          onClose={() => setDetailsVisible(false)}
        />
      )}
    </div>
  )
}

export default BackupManagementTab;