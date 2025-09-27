import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Avatar } from 'primereact/avatar';
import { useRef } from 'react';
import { assignmentService, vehicleService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { Vehicle, User } from '../../types';

const VehicleAssignmentPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<User[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<User | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const toast = useRef<Toast>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vehiclesData, driversData] = await Promise.all([
        vehicleService.getVehicles(),
        assignmentService.getAvailableDrivers()
      ]);
      
      setVehicles(vehiclesData);
      setAvailableDrivers(driversData.available_drivers || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Erreur lors du chargement des données'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedVehicle || !selectedDriver) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Veuillez sélectionner un véhicule et un conducteur'
      });
      return;
    }

    try {
      setAssignLoading(true);
      await assignmentService.assignDriverToVehicle(
        selectedVehicle.id.toString(),
        selectedDriver.id.toString()
      );

      toast.current?.show({
        severity: 'success',
        summary: 'Succès',
        detail: `${selectedDriver.first_name} ${selectedDriver.last_name} assigné(e) au véhicule ${selectedVehicle.vehicle_number}`
      });

      // Recharger les données
      await loadData();
      setShowAssignDialog(false);
      setSelectedVehicle(null);
      setSelectedDriver(null);
    } catch (error: any) {
      console.error('Erreur lors de l\'assignation:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Erreur',
        detail: error.response?.data?.error || 'Erreur lors de l\'assignation'
      });
    } finally {
      setAssignLoading(false);
    }
  };

  const handleUnassignDriver = (vehicle: Vehicle) => {
    confirmDialog({
      message: `Êtes-vous sûr de vouloir désassigner ${vehicle.assigned_driver_name} du véhicule ${vehicle.vehicle_number} ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await assignmentService.unassignDriverFromVehicle(vehicle.id.toString());
          
          toast.current?.show({
            severity: 'success',
            summary: 'Succès',
            detail: `Conducteur désassigné du véhicule ${vehicle.vehicle_number}`
          });

          // Recharger les données
          await loadData();
        } catch (error: any) {
          console.error('Erreur lors de la désassignation:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Erreur',
            detail: error.response?.data?.error || 'Erreur lors de la désassignation'
          });
        }
      }
    });
  };

  const vehicleTemplate = (rowData: Vehicle) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{
        width: '60px',
        height: '40px',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {rowData.front_image ? (
          <img 
            src={rowData.front_image} 
            alt={rowData.vehicle_number}
            style={{ 
              width: '60px', 
              height: '40px', 
              objectFit: 'cover', 
              borderRadius: '8px'
            }}
          />
        ) : (
          <i className="pi pi-truck" style={{ fontSize: '1.5rem', color: '#6b7280' }}></i>
        )}
      </div>
      <div>
        <div style={{ fontWeight: '600' }}>{rowData.vehicle_number}</div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          {rowData.make} {rowData.model} ({rowData.year})
        </div>
      </div>
    </div>
  );

  const driverTemplate = (rowData: Vehicle) => {
    if (rowData.assigned_driver_info) {
      const driver = rowData.assigned_driver_info;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Avatar 
            icon="pi pi-user"
            size="normal"
            shape="circle"
            style={{ backgroundColor: '#e5e7eb' }}
          />
          <div>
            <div style={{ fontWeight: '500' }}>{driver.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              CDL: {driver.cdl_number || 'N/A'}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
        <i className="pi pi-exclamation-triangle"></i>
        <span>Non assigné</span>
      </div>
    );
  };

  const statusTemplate = (rowData: Vehicle) => {
    const severity = rowData.is_assigned ? 'success' : 'warning';
    const value = rowData.is_assigned ? 'Assigné' : 'Disponible';
    return <Tag value={value} severity={severity} />;
  };

  const hosTemplate = (rowData: Vehicle) => {
    if (rowData.assigned_driver_info) {
      const driver = rowData.assigned_driver_info;
      const hosHours = driver.current_hos_hours || 0;
      const availableHours = driver.available_driving_hours || 70;
      
      const percentage = (hosHours / 70) * 100;
      let severity = 'success';
      if (percentage > 80) severity = 'danger';
      else if (percentage > 60) severity = 'warning';

      return (
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
            {hosHours.toFixed(1)}h / 70h
          </div>
          <Tag 
            value={`${availableHours.toFixed(1)}h disponibles`} 
            severity={severity as any}
            style={{ fontSize: '0.75rem' }}
          />
        </div>
      );
    }
    return <span style={{ color: '#6b7280' }}>-</span>;
  };

  const actionsTemplate = (rowData: Vehicle) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {!rowData.is_assigned ? (
        <Button
          icon="pi pi-user-plus"
          tooltip="Assigner un conducteur"
          tooltipOptions={{ position: 'top' }}
          size="small"
          onClick={() => {
            setSelectedVehicle(rowData);
            setShowAssignDialog(true);
          }}
        />
      ) : (
        <Button
          icon="pi pi-user-minus"
          tooltip="Désassigner le conducteur"
          tooltipOptions={{ position: 'top' }}
          severity="danger"
          size="small"
          onClick={() => handleUnassignDriver(rowData)}
        />
      )}
      
      {rowData.assigned_driver_info?.has_active_trip && (
        <Tag 
          value="Voyage en cours" 
          severity="info" 
          style={{ fontSize: '0.75rem' }}
        />
      )}
    </div>
  );

  const cardHeader = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
          width: '50px',
          height: '50px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          <i className="pi pi-users" style={{ fontSize: '1.5rem' }}></i>
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            Assignation Conducteurs-Véhicules
          </h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
            Gérer les assignations entre conducteurs et véhicules
          </p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: '600', fontSize: '1.25rem', color: '#3b82f6' }}>
            {vehicles.filter(v => v.is_assigned).length}
          </div>
          <div style={{ color: '#6b7280' }}>Assignés</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: '600', fontSize: '1.25rem', color: '#f59e0b' }}>
            {vehicles.filter(v => !v.is_assigned).length}
          </div>
          <div style={{ color: '#6b7280' }}>Disponibles</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: '600', fontSize: '1.25rem', color: '#10b981' }}>
            {availableDrivers.length}
          </div>
          <div style={{ color: '#6b7280' }}>Conducteurs libres</div>
        </div>
      </div>
    </div>
  );

  if (!user?.can_manage_users) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
          <i className="pi pi-ban" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
          <h3>Accès refusé</h3>
          <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Toast ref={toast} />
      
      <div style={{ padding: '1rem' }}>
        <Card header={cardHeader} style={{ marginBottom: '2rem' }}>
          <DataTable
            value={vehicles}
            loading={loading}
            paginator
            rows={10}
            emptyMessage="Aucun véhicule trouvé"
            scrollable
            scrollHeight="600px"
            style={{ marginTop: '1rem' }}
          >
            <Column 
              field="vehicle_number" 
              header="Véhicule" 
              body={vehicleTemplate}
              style={{ minWidth: '250px' }}
            />
            <Column 
              header="Conducteur assigné" 
              body={driverTemplate}
              style={{ minWidth: '200px' }}
            />
            <Column 
              header="Statut" 
              body={statusTemplate}
              style={{ minWidth: '120px' }}
            />
            <Column 
              header="HOS" 
              body={hosTemplate}
              style={{ minWidth: '150px' }}
            />
            <Column 
              header="Actions" 
              body={actionsTemplate}
              style={{ minWidth: '150px' }}
            />
          </DataTable>
        </Card>

        {/* Dialog d'assignation */}
        <Dialog
          header="Assigner un conducteur"
          visible={showAssignDialog}
          style={{ width: '500px' }}
          onHide={() => {
            setShowAssignDialog(false);
            setSelectedVehicle(null);
            setSelectedDriver(null);
          }}
        >
          <div style={{ display: 'grid', gap: '1.5rem', padding: '1rem' }}>
            {selectedVehicle && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Véhicule sélectionné :
                </label>
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#f3f4f6', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <i className="pi pi-truck" style={{ fontSize: '1.5rem', color: '#3b82f6' }}></i>
                  <div>
                    <div style={{ fontWeight: '600' }}>{selectedVehicle.vehicle_number}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {selectedVehicle.make} {selectedVehicle.model}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Conducteur à assigner :
              </label>
              <Dropdown
                value={selectedDriver}
                options={availableDrivers}
                onChange={(e) => setSelectedDriver(e.value)}
                optionLabel="full_name"
                placeholder="Sélectionner un conducteur"
                style={{ width: '100%' }}
                emptyMessage="Aucun conducteur disponible"
                itemTemplate={(option) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Avatar 
                      icon="pi pi-user"
                      size="normal"
                      shape="circle"
                      style={{ backgroundColor: '#e5e7eb' }}
                    />
                    <div>
                      <div>{option.first_name} {option.last_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        CDL: {option.cdl_number || 'N/A'} • {option.email}
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <Button
                label="Annuler"
                icon="pi pi-times"
                severity="secondary"
                onClick={() => {
                  setShowAssignDialog(false);
                  setSelectedVehicle(null);
                  setSelectedDriver(null);
                }}
              />
              <Button
                label="Assigner"
                icon="pi pi-check"
                loading={assignLoading}
                onClick={handleAssignDriver}
                disabled={!selectedDriver}
              />
            </div>
          </div>
        </Dialog>
      </div>
    </>
  );
};

export default VehicleAssignmentPage;