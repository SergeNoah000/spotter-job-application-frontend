import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Image } from 'primereact/image';
import { DataView } from 'primereact/dataview';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { Divider } from 'primereact/divider';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import useVehicles from '../../hooks/useVehicles';
import { useAuth } from '../../contexts/AuthContext';
import VehicleForm from '../Forms/VehicleForm';
import type { Vehicle, VehicleFormData } from '../../types';

const VehiclesPage: React.FC = () => {
  const { vehicles, loading, createVehicle, updateVehicle, deleteVehicle } = useVehicles();
  const { user } = useAuth();
  const toast = useRef<Toast>(null);

  const [showDialog, setShowDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const resetForm = () => {
    setEditingVehicle(null);
    setShowDialog(false);
  };

  const formDataToObject = (formData: FormData): VehicleFormData => {
    const vehicleData: VehicleFormData = {
      vehicle_number: formData.get('vehicle_number') as string,
      make: formData.get('make') as string,
      model: formData.get('model') as string,
      year: parseInt(formData.get('year') as string),
      vin: formData.get('vin') as string,
      license_plate: formData.get('license_plate') as string,
      company: user?.company || 0, // Utiliser automatiquement l'ID de la compagnie de l'utilisateur
      vehicle_type: formData.get('vehicle_type') as string,
      front_image: formData.get('front_image') as File,
      side_image: formData.get('side_image') as File,
      rear_image: formData.get('rear_image') as File,
    };

    // Supprimer les champs de fichiers s'ils sont vides ou null
    if (!vehicleData.front_image || vehicleData.front_image.size === 0) {
      delete vehicleData.front_image;
    }
    if (!vehicleData.side_image || vehicleData.side_image.size === 0) {
      delete vehicleData.side_image;
    }
    if (!vehicleData.rear_image || vehicleData.rear_image.size === 0) {
      delete vehicleData.rear_image;
    }

    return vehicleData;
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      // Convertir FormData en objet VehicleFormData
      const vehicleData: VehicleFormData = formDataToObject(formData);

      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, vehicleData);
      } else {
        await createVehicle(vehicleData);
      }
      resetForm();
      toast.current?.show({
        severity: 'success',
        summary: 'Succès',
        detail: editingVehicle ? 'Véhicule mis à jour' : 'Véhicule créé'
      });
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Erreur',
        detail: error.message || 'Une erreur est survenue'
      });
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowDialog(true);
  };

  const handleDelete = (vehicleId: number) => {
    confirmDialog({
      message: 'Êtes-vous sûr de vouloir supprimer ce véhicule ?',
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await deleteVehicle(vehicleId);
          toast.current?.show({
            severity: 'success',
            summary: 'Succès',
            detail: 'Véhicule supprimé avec succès'
          });
        } catch (error: any) {
          toast.current?.show({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la suppression'
          });
        }
      }
    });
  };

  const vehicleItemTemplate = (vehicle: any) => {
    return (
      <Card className="m-2 surface-card shadow-2 border-round-lg">
        <div className="flex flex-column">
          {/* En-tête de la carte */}
          <div className="flex justify-content-between align-items-center mb-3">
            <div className="flex align-items-center">
              <i className="pi pi-truck text-primary text-2xl mr-2"></i>
              <div>
                <h3 className="text-primary text-xl font-semibold m-0">
                  {vehicle.vehicle_number}
                </h3>
                <p className="text-color-secondary text-sm m-0">
                  {vehicle.make} {vehicle.model} ({vehicle.year})
                </p>
              </div>
            </div>
            <Tag 
              value={vehicle.is_active ? 'Actif' : 'Inactif'} 
              severity={vehicle.is_active ? 'success' : 'danger'}
              rounded
            />
          </div>

          {/* Images du véhicule */}
          <div className="grid mb-3">
            <div className="col-4">
              <div className="text-center">
                <p className="text-sm font-medium text-color-secondary mb-2">Vue de face</p>
                {vehicle.front_image ? (
                  <Image 
                    src={vehicle.front_image} 
                    alt="Vue de face"
                    width="100"
                    height="80"
                    className="border-round shadow-1"
                    preview
                  />
                ) : (
                  <div className="bg-gray-100 border-round flex align-items-center justify-content-center" 
                       style={{ width: '100px', height: '80px' }}>
                    <i className="pi pi-image text-gray-400 text-2xl"></i>
                  </div>
                )}
              </div>
            </div>
            <div className="col-4">
              <div className="text-center">
                <p className="text-sm font-medium text-color-secondary mb-2">Vue de profil</p>
                {vehicle.side_image ? (
                  <Image 
                    src={vehicle.side_image} 
                    alt="Vue de profil"
                    width="100"
                    height="80"
                    className="border-round shadow-1"
                    preview
                  />
                ) : (
                  <div className="bg-gray-100 border-round flex align-items-center justify-content-center" 
                       style={{ width: '100px', height: '80px' }}>
                    <i className="pi pi-image text-gray-400 text-2xl"></i>
                  </div>
                )}
              </div>
            </div>
            <div className="col-4">
              <div className="text-center">
                <p className="text-sm font-medium text-color-secondary mb-2">Vue arrière</p>
                {vehicle.rear_image ? (
                  <Image 
                    src={vehicle.rear_image} 
                    alt="Vue arrière"
                    width="100"
                    height="80"
                    className="border-round shadow-1"
                    preview
                  />
                ) : (
                  <div className="bg-gray-100 border-round flex align-items-center justify-content-center" 
                       style={{ width: '100px', height: '80px' }}>
                    <i className="pi pi-image text-gray-400 text-2xl"></i>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Informations du véhicule */}
          <div className="grid mb-3">
            <div className="col-6">
              <div className="mb-2">
                <span className="text-sm font-medium text-color-secondary">VIN:</span>
                <p className="text-sm m-0 mt-1">{vehicle.vin}</p>
              </div>
            </div>
            <div className="col-6">
              <div className="mb-2">
                <span className="text-sm font-medium text-color-secondary">Plaque:</span>
                <p className="text-sm m-0 mt-1">{vehicle.license_plate}</p>
              </div>
            </div>
          </div>

          <Divider className="my-2" />

          {/* Actions */}
          <div className="flex justify-content-end gap-2">
            <Button
              icon="pi pi-pencil"
              label="Modifier"
              size="small"
              className="p-button-outlined p-button-primary"
              onClick={() => handleEdit(vehicle)}
            />
            <Button
              icon="pi pi-trash"
              label="Supprimer"
              size="small"
              className="p-button-outlined p-button-danger"
              onClick={() => handleDelete(vehicle.id)}
            />
          </div>
        </div>
      </Card>
    );
  };

  const leftToolbarTemplate = () => {
    return (
      <div className="flex align-items-center">
        <i className="pi pi-truck text-primary text-2xl mr-3"></i>
        <div>
          <h1 className="text-primary text-2xl font-bold m-0">Gestion des Véhicules</h1>
          <p className="text-color-secondary m-0">
            {vehicles.length} véhicule{vehicles.length > 1 ? 's' : ''} enregistré{vehicles.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <Button
        icon="pi pi-plus"
        label="Nouveau Véhicule"
        className="p-button-primary"
        onClick={() => setShowDialog(true)}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <i className="pi pi-spin pi-spinner text-4xl text-primary"></i>
      </div>
    );
  }

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="surface-ground min-h-screen p-4">
        <Toolbar
          className="mb-4 surface-card shadow-2 border-round"
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
        />

        {vehicles.length === 0 ? (
          <Card className="text-center surface-card shadow-2 border-round">
            <div className="p-6">
              <i className="pi pi-truck text-gray-400 text-6xl mb-4"></i>
              <h3 className="text-color-secondary">Aucun véhicule trouvé</h3>
              <p className="text-color-secondary mb-4">
                Ajoutez votre premier véhicule pour commencer
              </p>
              <Button
                label="Ajouter un véhicule"
                icon="pi pi-plus"
                onClick={() => setShowDialog(true)}
              />
            </div>
          </Card>
        ) : (
          <DataView
            value={vehicles}
            itemTemplate={vehicleItemTemplate}
            layout="grid"
            paginator
            rows={6}
            emptyMessage="Aucun véhicule trouvé"
          />
        )}

        <Dialog
          header={editingVehicle ? 'Modifier le véhicule' : 'Nouveau véhicule'}
          visible={showDialog}
          style={{ width: '50vw' }}
          onHide={resetForm}
          maximizable
        >
          <VehicleForm
            vehicle={editingVehicle || undefined}
            onSubmit={handleSubmit}
            onCancel={resetForm}
          />
        </Dialog>
      </div>
    </>
  );
};

export default VehiclesPage;