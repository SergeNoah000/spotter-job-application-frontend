import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Card,
  Space,
  Typography,
  Divider,
  Tag,
  Popconfirm,
  Row,
  Col,
  InputNumber,
  DatePicker
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CarOutlined,
  SearchOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;

interface Vehicle {
  id: number;
  vehicle_number: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  status: 'active' | 'inactive' | 'maintenance';
  fuel_type: string;
  odometer: number;
  registration_expiry: string;
  insurance_expiry: string;
  created_at: string;
  updated_at: string;
}

const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setTableLoading(true);
      // TODO: Remplacer par l'appel API réel
      // const response = await getVehicles();
      // setVehicles(response.data);
      
      // Données de test pour le moment
      const mockVehicles: Vehicle[] = [
        {
          id: 1,
          vehicle_number: 'TRK001',
          make: 'Volvo',
          model: 'VNL 860',
          year: 2022,
          license_plate: 'ABC-123',
          vin: '1FUJGHDV8MLBX1234',
          status: 'active',
          fuel_type: 'diesel',
          odometer: 125000,
          registration_expiry: '2024-12-31',
          insurance_expiry: '2024-06-30',
          created_at: '2024-01-15',
          updated_at: '2024-01-15'
        }
      ];
      setVehicles(mockVehicles);
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error);
      message.error('Erreur lors du chargement des véhicules');
    } finally {
      setTableLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      const vehicleData = {
        ...values,
        registration_expiry: values.registration_expiry?.format('YYYY-MM-DD'),
        insurance_expiry: values.insurance_expiry?.format('YYYY-MM-DD'),
      };

      if (editingVehicle) {
        // TODO: Remplacer par l'appel API réel
        // await updateVehicle(editingVehicle.id, vehicleData);
        const updatedVehicle = { ...editingVehicle, ...vehicleData, id: editingVehicle.id };
        setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? updatedVehicle : v));
        message.success('Véhicule modifié avec succès');
      } else {
        // TODO: Remplacer par l'appel API réel
        // const response = await createVehicle(vehicleData);
        const newVehicle = { 
          ...vehicleData, 
          id: Date.now(),
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0]
        };
        setVehicles(prev => [...prev, newVehicle]);
        message.success('Véhicule ajouté avec succès');
      }
      
      closeModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      message.error('Erreur lors de la sauvegarde du véhicule');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      // TODO: Remplacer par l'appel API réel
      // await deleteVehicle(id);
      setVehicles(prev => prev.filter(v => v.id !== id));
      message.success('Véhicule supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      message.error('Erreur lors de la suppression du véhicule');
    }
  };

  const openModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      form.setFieldsValue({
        ...vehicle,
        registration_expiry: vehicle.registration_expiry ? moment(vehicle.registration_expiry) : null,
        insurance_expiry: vehicle.insurance_expiry ? moment(vehicle.insurance_expiry) : null,
      });
    } else {
      setEditingVehicle(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
    form.resetFields();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'maintenance': return 'orange';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'maintenance': return 'En maintenance';
      default: return status;
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.vehicle_number?.toLowerCase().includes(searchText.toLowerCase()) ||
    vehicle.make?.toLowerCase().includes(searchText.toLowerCase()) ||
    vehicle.model?.toLowerCase().includes(searchText.toLowerCase()) ||
    vehicle.license_plate?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'N° Véhicule',
      dataIndex: 'vehicle_number',
      key: 'vehicle_number',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Marque/Modèle',
      key: 'make_model',
      render: (record: Vehicle) => (
        <div>
          <Text strong>{record.make}</Text>
          <br />
          <Text type="secondary">{record.model} ({record.year})</Text>
        </div>
      ),
    },
    {
      title: 'Plaque',
      dataIndex: 'license_plate',
      key: 'license_plate',
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Carburant',
      dataIndex: 'fuel_type',
      key: 'fuel_type',
      render: (text: string) => text?.charAt(0).toUpperCase() + text?.slice(1),
    },
    {
      title: 'Odomètre (km)',
      dataIndex: 'odometer',
      key: 'odometer',
      render: (value: number) => value?.toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Vehicle) => (
        <Space>
          <Button
            type="primary"
            ghost
            size="small"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            Modifier
          </Button>
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer ce véhicule ?"
            onConfirm={() => handleDelete(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button
              type="primary"
              danger
              ghost
              size="small"
              icon={<DeleteOutlined />}
            >
              Supprimer
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
          <Col>
            <Space align="center">
              <CarOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <Title level={2} style={{ margin: 0 }}>
                Gestion des Véhicules
              </Title>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
              size="large"
            >
              Ajouter un véhicule
            </Button>
          </Col>
        </Row>

        <Row style={{ marginBottom: '16px' }}>
          <Col span={8}>
            <Input
              placeholder="Rechercher un véhicule..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredVehicles}
          rowKey="id"
          loading={tableLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} sur ${total} véhicules`,
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <CarOutlined />
            {editingVehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
          </Space>
        }
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'active',
            fuel_type: 'diesel'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Numéro de véhicule"
                name="vehicle_number"
                rules={[
                  { required: true, message: 'Le numéro de véhicule est requis' },
                  { min: 2, message: 'Le numéro doit contenir au moins 2 caractères' }
                ]}
              >
                <Input placeholder="Ex: TRK001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Plaque d'immatriculation"
                name="license_plate"
                rules={[
                  { required: true, message: 'La plaque d\'immatriculation est requise' }
                ]}
              >
                <Input placeholder="Ex: ABC-123" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Marque"
                name="make"
                rules={[{ required: true, message: 'La marque est requise' }]}
              >
                <Select placeholder="Sélectionner une marque">
                  <Option value="Volvo">Volvo</Option>
                  <Option value="Kenworth">Kenworth</Option>
                  <Option value="Peterbilt">Peterbilt</Option>
                  <Option value="Freightliner">Freightliner</Option>
                  <Option value="Mack">Mack</Option>
                  <Option value="International">International</Option>
                  <Option value="Ford">Ford</Option>
                  <Option value="Chevrolet">Chevrolet</Option>
                  <Option value="Autre">Autre</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Modèle"
                name="model"
                rules={[{ required: true, message: 'Le modèle est requis' }]}
              >
                <Input placeholder="Ex: VNL 860" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Année"
                name="year"
                rules={[
                  { required: true, message: 'L\'année est requise' },
                  { 
                    type: 'number', 
                    min: 1990, 
                    max: new Date().getFullYear() + 1,
                    message: 'Année invalide' 
                  }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  placeholder="2022"
                  min={1990}
                  max={new Date().getFullYear() + 1}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="VIN (Numéro d'identification)"
                name="vin"
                rules={[
                  { required: true, message: 'Le VIN est requis' },
                  { len: 17, message: 'Le VIN doit contenir exactement 17 caractères' }
                ]}
              >
                <Input 
                  placeholder="17 caractères" 
                  maxLength={17}
                  style={{ textTransform: 'uppercase' }}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Type de carburant"
                name="fuel_type"
                rules={[{ required: true, message: 'Le type de carburant est requis' }]}
              >
                <Select placeholder="Sélectionner le carburant">
                  <Option value="diesel">Diesel</Option>
                  <Option value="essence">Essence</Option>
                  <Option value="electrique">Électrique</Option>
                  <Option value="hybride">Hybride</Option>
                  <Option value="gaz_naturel">Gaz naturel</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Statut"
                name="status"
                rules={[{ required: true, message: 'Le statut est requis' }]}
              >
                <Select placeholder="Sélectionner le statut">
                  <Option value="active">Actif</Option>
                  <Option value="inactive">Inactif</Option>
                  <Option value="maintenance">En maintenance</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Odomètre (km)"
                name="odometer"
                rules={[
                  { required: true, message: 'L\'odomètre est requis' },
                  { type: 'number', min: 0, message: 'L\'odomètre doit être positif' }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  placeholder="125000"
                  min={0}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                //   parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Expiration de l'immatriculation"
                name="registration_expiry"
                rules={[{ required: true, message: 'La date d\'expiration est requise' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  placeholder="Sélectionner la date"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Expiration de l'assurance"
                name="insurance_expiry"
                rules={[{ required: true, message: 'La date d\'expiration est requise' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  placeholder="Sélectionner la date"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Row justify="end">
            <Space>
              <Button onClick={closeModal}>
                Annuler
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={editingVehicle ? <EditOutlined /> : <PlusOutlined />}
              >
                {editingVehicle ? 'Modifier' : 'Ajouter'}
              </Button>
            </Space>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default VehiclesPage;