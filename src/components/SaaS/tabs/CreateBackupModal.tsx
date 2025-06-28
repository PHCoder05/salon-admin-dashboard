import React, { useState } from 'react';
import { Modal, Button, Form, Select, Checkbox, Space, Alert, DatePicker, Input, Radio } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BackupService from '../../../services/backupService';
import type { BackupOptions } from '../../../types/saas';
import type { Profile } from '../../../types/profiles';
import { supabase } from '../../../lib/supabase';
import { DatabaseOutlined, CalendarOutlined, CloudUploadOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

interface CreateBackupModalProps {
  visible: boolean;
  onClose: () => void;
}

interface FormValues {
  type: 'full' | 'incremental' | 'differential';
  tables: string[];
  clientId?: string;
  dateRange?: [string, string];
  compression: boolean;
  encryption: boolean;
  storageType: 'cloud' | 'local' | 'both';
  description?: string;
  priority: 'low' | 'medium' | 'high';
  retentionPeriod: number;
}

interface TableStats {
  total_rows: number;
  total_size: number;
  table_names: string[];
}

const CreateBackupModal: React.FC<CreateBackupModalProps> = ({ visible, onClose }) => {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();
  const backupService = BackupService.getInstance();

  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>();
  const [compressionEnabled, setCompressionEnabled] = useState(true);
  const [selectAllTables, setSelectAllTables] = useState(false);

  // Fetch available tables
  const { data: tables = [] } = useQuery<string[]>(['tables'], async () => {
    const { data: tableStats, error: statsError } = await supabase
      .rpc('get_table_stats')

    if (statsError) throw statsError
    return (tableStats as { table_names: string[] }).table_names || []
  });

  // Fetch clients
  const { data: clients = [], isLoading: loadingClients } = useQuery<Profile[]>(['clients'], async () => {
    const { data } = await supabase.from('profiles')
      .select('id, full_name, email, phone_number, created_at, updated_at')
      .returns<Profile[]>();
    return data || [];
  });

  const createBackupMutation = useMutation(
    (values: FormValues) => {
      const backupOptions: BackupOptions = {
        type: values.type,
        compression: values.compression,
        encryption: values.encryption,
        tables: selectAllTables ? [] : values.tables,
        clientId: values.clientId,
        storageType: values.storageType,
        dateRange: values.dateRange,
        description: values.description,
        priority: values.priority,
        retentionPeriod: values.retentionPeriod,
        selectAllTables
      };
      return backupService.createBackup(backupOptions);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['backups']);
        onClose();
        form.resetFields();
      },
    }
  );

  const handleSubmit = (values: FormValues) => {
    createBackupMutation.mutate(values);
  };

  const handleTableSelect = (value: string[]) => {
    setSelectedTables(value);
    setSelectAllTables(false);
  };

  const handleSelectAllTables = (checked: boolean) => {
    setSelectAllTables(checked);
    if (checked) {
      setSelectedTables([]);
    }
  };

  const handleClientSelect = (value: string) => {
    setSelectedClient(value);
    form.setFieldsValue({ clientId: value });
  };

  return (
    <Modal
      title="Create New Backup"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          type: 'full',
          compression: true,
          encryption: true,
          storageType: 'cloud',
          priority: 'medium',
          retentionPeriod: 30
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Basic Information */}
          <div className="backup-section">
            <h4>Basic Information</h4>
            <Form.Item
              name="type"
              label="Backup Type"
              rules={[{ required: true, message: 'Please select backup type' }]}
            >
              <Radio.Group>
                <Space direction="vertical">
                  <Radio value="full">
                    Full Backup
                    <span className="text-gray-400 text-sm ml-2">(Complete backup of selected data)</span>
                  </Radio>
                  <Radio value="incremental">
                    Incremental Backup
                    <span className="text-gray-400 text-sm ml-2">(Only changes since last backup)</span>
                  </Radio>
                  <Radio value="differential">
                    Differential Backup
                    <span className="text-gray-400 text-sm ml-2">(Changes since last full backup)</span>
                  </Radio>
                </Space>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="description"
              label="Backup Description"
            >
              <Input.TextArea
                placeholder="Enter a description for this backup"
                rows={2}
              />
            </Form.Item>
          </div>

          {/* Data Selection */}
          <div className="backup-section">
            <h4>Data Selection</h4>
            <Form.Item
              name="clientId"
              label="Select Client"
            >
              <Select
                placeholder="Select a client (optional)"
                onChange={handleClientSelect}
                allowClear
                loading={loadingClients}
              >
                {clients.map((client) => (
                  <Select.Option key={client.id} value={client.id}>
                    {client.full_name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Table Selection">
              <Checkbox
                checked={selectAllTables}
                onChange={(e) => handleSelectAllTables(e.target.checked)}
              >
                Select All Tables
              </Checkbox>
            </Form.Item>

            {!selectAllTables && (
              <Form.Item
                name="tables"
                rules={[{ required: !selectAllTables, message: 'Please select at least one table' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Select tables to backup"
                  onChange={handleTableSelect}
                  style={{ width: '100%' }}
                  loading={!tables}
                >
                  {tables.map((table) => (
                    <Select.Option key={table} value={table}>
                      {table}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            <Form.Item
              name="dateRange"
              label="Date Range"
            >
              <RangePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                placeholder={['Start Date', 'End Date']}
              />
            </Form.Item>
          </div>

          {/* Backup Settings */}
          <div className="backup-section">
            <h4>Backup Settings</h4>
            <Space>
              <Form.Item
                name="compression"
                valuePropName="checked"
              >
                <Checkbox
                  onChange={(e) => setCompressionEnabled(e.target.checked)}
                >
                  Enable Compression
                </Checkbox>
              </Form.Item>

              <Form.Item
                name="encryption"
                valuePropName="checked"
              >
                <Checkbox>Enable Encryption</Checkbox>
              </Form.Item>
            </Space>

            <Form.Item
              name="storageType"
              label="Storage Location"
              rules={[{ required: true, message: 'Please select storage type' }]}
            >
              <Radio.Group>
                <Radio value="cloud">Cloud Storage</Radio>
                <Radio value="local">Local Storage</Radio>
                <Radio value="both">Both Cloud & Local</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="priority"
              label="Backup Priority"
              rules={[{ required: true, message: 'Please select priority' }]}
            >
              <Select>
                <Select.Option value="low">Low</Select.Option>
                <Select.Option value="medium">Medium</Select.Option>
                <Select.Option value="high">High</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="retentionPeriod"
              label="Retention Period (days)"
              rules={[{ required: true, message: 'Please specify retention period' }]}
            >
              <Select>
                <Select.Option value={7}>7 days</Select.Option>
                <Select.Option value={30}>30 days</Select.Option>
                <Select.Option value={90}>90 days</Select.Option>
                <Select.Option value={180}>180 days</Select.Option>
                <Select.Option value={365}>365 days</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item>
            <Space>
              <Button onClick={onClose}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<CloudUploadOutlined />}
                loading={createBackupMutation.isLoading}
              >
                Create Backup
              </Button>
            </Space>
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
};

export default CreateBackupModal; 