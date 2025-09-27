import React from 'react';
import { Trip } from '../../types';
import { Route, MapPin, Clock, Car, Play, Square } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TripListProps {
  trips: Trip[];
  onStartTrip: (id: number) => void;
  onEndTrip: (id: number) => void;
}

const TripList: React.FC<TripListProps> = ({ trips, onStartTrip, onEndTrip }) => {
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

  return (
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
                  {trip.status === 'planned' && (
                    <button
                      onClick={() => onStartTrip(trip.id)}
                      className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Démarrer
                    </button>
                  )}
                  
                  {trip.status === 'in_progress' && (
                    <button
                      onClick={() => onEndTrip(trip.id)}
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
  );
};

export default TripList;