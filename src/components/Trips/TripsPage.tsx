import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrips, useVehicles } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Route, 
  Plus, 
  Play, 
  Square, 
  MapPin, 
  Clock,
  Car
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TripsPage: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { trips, loading, createTrip, startTrip, endTrip } = useTrips();
  const { vehicles } = useVehicles();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [newTrip, setNewTrip] = useState({
    vehicle: 0,
    origin: '',
    destination: '',
    start_location: '',
    end_location: '',
    start_time: '',
  });

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTrip({
        vehicle: parseInt(newTrip.vehicle.toString()),
        origin: newTrip.origin,
        destination: newTrip.destination,
        start_location: newTrip.start_location,
        end_location: newTrip.end_location,
        start_time: newTrip.start_time,
      });
      setNewTrip({
        vehicle: 0,
        origin: '',
        destination: '',
        start_location: '',
        end_location: '',
        start_time: '',
      });
      setShowCreateForm(false);
      if (user?.role === 'driver') {
        navigate('/driver-dashboard');
      }
    } catch (error) {
      console.error('Erreur lors de la création du voyage:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned': return 'Planifié';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Voyages</h1>
          <p className="text-gray-600">Gérez et suivez tous vos voyages</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouveau Voyage
        </button>
      </div>

      {/* Create Trip Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Créer un Nouveau Voyage</h2>
          
          <form onSubmit={handleCreateTrip} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Véhicule
              </label>
              <select
                value={newTrip.vehicle}
                onChange={(e) => setNewTrip({ ...newTrip, vehicle: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionner un véhicule</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicle_number} - {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure de départ
              </label>
              <input
                type="datetime-local"
                value={newTrip.start_time}
                onChange={(e) => setNewTrip({ ...newTrip, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lieu de départ
              </label>
              <input
                type="text"
                placeholder="Adresse de départ"
                value={newTrip.start_location}
                onChange={(e) => setNewTrip({ ...newTrip, start_location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination
              </label>
              <input
                type="text"
                placeholder="Adresse de destination"
                value={newTrip.end_location}
                onChange={(e) => setNewTrip({ ...newTrip, end_location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="md:col-span-2 flex space-x-4">
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer le Voyage
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Trips List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Liste des Voyages</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {trips.length === 0 ? (
            <div className="p-8 text-center">
              <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun voyage trouvé</p>
              <p className="text-sm text-gray-400">Créez votre premier voyage pour commencer</p>
            </div>
          ) : (
            trips.map((trip) => (
              <div key={trip.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Route className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            Voyage #{trip.id}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                            {getStatusText(trip.status)}
                          </span>
                        </div>
                        
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{trip.origin} → {trip.destination}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{trip.start_time ? format(new Date(trip.start_time), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'Non défini'}</span>
                          </div>
                          
                          {trip.distance && (
                            <div className="flex items-center">
                              <Car className="h-4 w-4 mr-1" />
                              <span>{trip.distance} miles</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startTrip(trip.id)}
                        style={{ backgroundColor: 'green', color: 'white' }}
                        className="flex items-center px-3 py-1 text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Démarrer
                      </button>
                    
                    {trip.status === 'in_progress' && (
                      <button
                        onClick={() => endTrip(trip.id)}
                        className="flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Square className="h-4 w-4 mr-1" />
                        Terminer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TripsPage;