import { useState, useEffect } from 'react';
import { vehicleService } from '../services/api';
import type { Vehicle, VehicleFormData } from '../types';
import toast from 'react-hot-toast';

const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const data = await vehicleService.getVehicles();
      setVehicles(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors du chargement des véhicules');
    } finally {
      setLoading(false);
    }
  };

  const createVehicle = async (vehicleData: VehicleFormData) => {
    try {
      const newVehicle = await vehicleService.createVehicle(vehicleData);
      setVehicles(prev => [...prev, newVehicle]);
      toast.success('Véhicule créé avec succès');
      return newVehicle;
    } catch (err: any) {
      toast.error('Erreur lors de la création du véhicule');
      throw err;
    }
  };

  const updateVehicle = async (id: number, vehicleData: Partial<VehicleFormData>) => {
    try {
      const updatedVehicle = await vehicleService.updateVehicle(id, vehicleData);
      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === id ? updatedVehicle : vehicle
      ));
      toast.success('Véhicule mis à jour avec succès');
      return updatedVehicle;
    } catch (err: any) {
      toast.error('Erreur lors de la mise à jour du véhicule');
      throw err;
    }
  };

  const deleteVehicle = async (id: number) => {
    try {
      await vehicleService.deleteVehicle(id);
      setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
      toast.success('Véhicule supprimé avec succès');
    } catch (err: any) {
      toast.error('Erreur lors de la suppression du véhicule');
      throw err;
    }
  };

  const toggleVehicleStatus = async (id: number) => {
    try {
      const vehicle = vehicles.find(v => v.id === id);
      if (!vehicle) return;

      const updatedVehicle = await vehicleService.updateVehicle(id, {
        is_active: !vehicle.is_active
      });
      
      setVehicles(prev => prev.map(v => 
        v.id === id ? updatedVehicle : v
      ));
      
      toast.success(`Véhicule ${updatedVehicle.is_active ? 'activé' : 'désactivé'}`);
      return updatedVehicle;
    } catch (err: any) {
      toast.error('Erreur lors du changement de statut du véhicule');
      throw err;
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  return {
    vehicles,
    loading,
    error,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    toggleVehicleStatus
  };
};

export default useVehicles;