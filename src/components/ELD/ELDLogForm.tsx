import React, { useState } from 'react';
import { useVehicles } from '../../hooks';
import { eldService } from '../../services/api';
import { ELDLogFormData, DutyStatus } from '../../types';
import { FileText, Plus, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const ELDLogForm: React.FC = () => {
  const { vehicles } = useVehicles();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ELDLogFormData>({
    vehicle: 0,
    duty_status: 'off_duty' as DutyStatus,
    location: '',
    odometer_reading: undefined,
    engine_hours: undefined,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newLog = await eldService.createELDLog({
        driver: 1, // Sera défini côté backend
        log_date: new Date().toISOString().split('T')[0],
        start_time: new Date().toTimeString().split(' ')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...formData,
      });
      
      toast.success('Journal ELD créé avec succès');
      
      // Reset form
      setFormData({
        vehicle: 0,
        duty_status: 'off_duty' as DutyStatus,
        location: '',
        odometer_reading: undefined,
        engine_hours: undefined,
        notes: '',
      });
    } catch (error: any) {
      toast.error('Erreur lors de la création du journal ELD');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const dutyStatusOptions = [
    { value: 'off_duty', label: 'Hors service' },
    { value: 'sleeper_berth', label: 'Couchette' },
    { value: 'driving', label: 'Conduite' },
    { value: 'on_duty_not_driving', label: 'En service (pas de conduite)' },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center mb-6">
        <FileText className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Nouveau Journal ELD</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Véhicule *
            </label>
            <select
              value={formData.vehicle}
              onChange={(e) => setFormData({ ...formData, vehicle: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value={0}>Sélectionner un véhicule</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.vehicle_number} - {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut de service *
            </label>
            <select
              value={formData.duty_status}
              onChange={(e) => setFormData({ ...formData, duty_status: e.target.value as DutyStatus })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {dutyStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localisation *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Adresse ou ville"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kilométrage
            </label>
            <input
              type="number"
              value={formData.odometer_reading || ''}
              onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="Kilométrage actuel"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Heures moteur
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.engine_hours || ''}
              onChange={(e) => setFormData({ ...formData, engine_hours: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="Heures moteur"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Notes additionnelles..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Création...' : 'Créer le Journal'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ELDLogForm;