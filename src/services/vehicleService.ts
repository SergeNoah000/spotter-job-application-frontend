import api from './api';
import { Vehicle } from '../types';

export const vehicleService = {
  async getVehicles(): Promise<Vehicle[]> {
    const response = await api.get('/vehicles/');
    return response.data;
  },

  async createVehicle(formData: FormData): Promise<Vehicle> {
    // Ne pas définir Content-Type manuellement avec FormData
    // Le navigateur le définira automatiquement avec le bon boundary
    const response = await api.post('/vehicles/', formData);
    return response.data;
  },

  async updateVehicle(id: number, formData: FormData): Promise<Vehicle> {
    // Ne pas définir Content-Type manuellement avec FormData
    const response = await api.put(`/vehicles/${id}/`, formData);
    return response.data;
  },

  async deleteVehicle(id: number): Promise<void> {
    await api.delete(`/vehicles/${id}/`);
  }
};