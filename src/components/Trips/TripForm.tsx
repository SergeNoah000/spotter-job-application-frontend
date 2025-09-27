import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TripFormData, Vehicle } from '../../types';
import { AddressAutocomplete } from '../AddressAutocomplete';
import { Location } from '../../services/geocoding';
import { Route, Plus, Save, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

interface TripFormProps {
  vehicles: Vehicle[];
  onSubmit: (data: TripFormData) => Promise<any>;
  onCancel: () => void;
}

interface LocationData {
  address: string;
  coordinates?: Location;
}

const TripForm: React.FC<TripFormProps> = ({ vehicles, onSubmit, onCancel }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [originData, setOriginData] = useState<LocationData>({ address: '' });
  const [destinationData, setDestinationData] = useState<LocationData>({ address: '' });
  
  const [formData, setFormData] = useState<TripFormData>({
    vehicle: 0,
    origin: '',
    destination: '',
    start_location: '',
    end_location: '',
    start_time: '',
    notes: '',
  });

  // Initialiser l'heure de départ à maintenant + 1 heure
  useEffect(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const defaultStartTime = now.toISOString().slice(0, 16);
    
    setFormData(prev => ({
      ...prev,
      start_time: defaultStartTime
    }));
  }, []);

  const handleOriginChange = (address: string, location?: Location) => {
    setOriginData({ address, coordinates: location });
    setFormData(prev => ({
      ...prev,
      origin: address,
      start_location: address
    }));
  };

  const handleDestinationChange = (address: string, location?: Location) => {
    setDestinationData({ address, coordinates: location });
    setFormData(prev => ({
      ...prev,
      destination: address,
      end_location: address
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.vehicle) {
      toast.error('Veuillez sélectionner un véhicule');
      return false;
    }
    
    if (!originData.address || !destinationData.address) {
      toast.error('Veuillez renseigner le lieu de départ et la destination');
      return false;
    }
    
    if (!formData.start_time) {
      toast.error('Veuillez sélectionner une heure de départ');
      return false;
    }

    // Vérifier que l'heure de départ n'est pas dans le passé
    const startTime = new Date(formData.start_time);
    const now = new Date();
    if (startTime < now) {
      toast.error('L\'heure de départ ne peut pas être dans le passé');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Enrichir les données avec les coordonnées GPS si disponibles
      const enrichedData = {
        ...formData,
        origin_coordinates: originData.coordinates,
        destination_coordinates: destinationData.coordinates
      };

      const createdTrip = await onSubmit(enrichedData);
      
      toast.success('Voyage créé avec succès !');
      
      // Rediriger vers la page de tracking après création
      if (createdTrip && createdTrip.id) {
        toast.success('🚗 Redirection vers la navigation GPS...', { duration: 2000 });
        
        setTimeout(() => {
          navigate(`/tracking/${createdTrip.id}`);
        }, 1500);
      } else {
        // Fallback si pas d'ID retourné
        navigate('/driver');
      }
      
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      toast.error(error.message || 'Erreur lors de la création du voyage');
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimatedDistance = (): string => {
    if (originData.coordinates && destinationData.coordinates) {
      // Calculer la distance à vol d'oiseau
      const R = 6371; // Rayon de la Terre en km
      const dLat = (destinationData.coordinates.lat - originData.coordinates.lat) * Math.PI / 180;
      const dLng = (destinationData.coordinates.lng - originData.coordinates.lng) * Math.PI / 180;
      
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(originData.coordinates.lat * Math.PI / 180) * 
                Math.cos(destinationData.coordinates.lat * Math.PI / 180) * 
                Math.sin(dLng/2) * Math.sin(dLng/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return `Distance estimée: ${distance.toFixed(1)} km`;
    }
    return '';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center mb-6">
        <Route className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Créer un Nouveau Voyage</h2>
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
                  {vehicle.assigned_driver_name && ` (${vehicle.assigned_driver_name})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Heure de départ *
            </label>
            <input
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Champs d'adresse avec autocomplétion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <AddressAutocomplete
              label="Lieu de départ"
              value={originData.address}
              onChange={handleOriginChange}
              placeholder="Rechercher l'adresse de départ..."
              required
            />
            {originData.coordinates && (
              <div className="mt-2 text-xs text-green-600 flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                Position GPS détectée
              </div>
            )}
          </div>

          <div>
            <AddressAutocomplete
              label="Destination"
              value={destinationData.address}
              onChange={handleDestinationChange}
              placeholder="Rechercher l'adresse de destination..."
              required
            />
            {destinationData.coordinates && (
              <div className="mt-2 text-xs text-green-600 flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                Position GPS détectée
              </div>
            )}
          </div>
        </div>

        {/* Informations sur le trajet */}
        {originData.coordinates && destinationData.coordinates && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Route className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {calculateEstimatedDistance()}
                </p>
                <p className="text-xs text-blue-700">
                  La navigation GPS sera activée automatiquement après création
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes du voyage
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Instructions spéciales, livraisons, contacts..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex-1 justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Route className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Création en cours...' : 'Créer et Démarrer la Navigation'}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
        </div>

        {/* Aide à l'utilisateur */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-900">Conseil</h4>
              <div className="mt-1 text-sm text-gray-600">
                <p>• Utilisez l'autocomplétion pour sélectionner des adresses précises</p>
                <p>• Cliquez sur l'icône boussole pour utiliser votre position actuelle</p>
                <p>• Après création, vous serez automatiquement redirigé vers la navigation GPS</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TripForm;