import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { ProgressBar } from 'primereact/progressbar';
import { Panel } from 'primereact/panel';
import { tripService } from '../services/api';
import { geocodingService, Location, RouteData } from '../services/geocoding';
import { Trip } from '../types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface NavigationState {
  currentPosition: Location | null;
  destination: Location | null;
  route: RouteData | null;
  remainingDistance: number;
  estimatedArrival: string | null;
  isTracking: boolean;
  speed: number;
  bearing: number;
}

// Étendre le type Trip pour inclure les propriétés de navigation
interface TripWithNavigation extends Trip {
  destination_lat?: number;
  destination_lng?: number;
  current_lat?: number;
  current_lng?: number;
  route_data?: string;
  estimated_distance_km?: number;
  estimated_duration_minutes?: number;
}

// Composant pour centrer la carte
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
};

const TrackingPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [trip, setTrip] = useState<TripWithNavigation | null>(null);
  const [navigation, setNavigation] = useState<NavigationState>({
    currentPosition: null,
    destination: null,
    route: null,
    remainingDistance: 0,
    estimatedArrival: null,
    isTracking: false,
    speed: 0,
    bearing: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!tripId) {
      setError('ID de voyage manquant');
      setLoading(false);
      return;
    }

    loadTripData();
    startNavigation();

    return () => {
      stopTracking();
    };
  }, [tripId]);

  const loadTripData = async () => {
    try {
      const tripData = await tripService.getTrip(parseInt(tripId!));
      setTrip(tripData);
      
      // Géocoder la destination si pas encore fait
      if (tripData.destination ) {
        const destLocation = await geocodingService.searchAddress(tripData.destination);
        if (destLocation.length > 0) {
          setNavigation(prev => ({
            ...prev,
            destination: {
              lat: parseFloat(destLocation[0].lat),
              lng: parseFloat(destLocation[0].lng),
              address: destLocation[0].display_name
            }
          }));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du voyage:', error);
      setError('Impossible de charger les données du voyage');
    }
  };

  const startNavigation = async () => {
    try {
      // Obtenir la position actuelle
      const currentPos = await geocodingService.getCurrentPosition();
      if (!currentPos) {
        throw new Error('Impossible d\'obtenir la position GPS');
      }

      // Démarrer le voyage avec navigation côté backend
      const response = await fetch(`http://localhost:8000/api/trips/${tripId}/start-navigation/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          current_latitude: currentPos.lat,
          current_longitude: currentPos.lng
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du démarrage de la navigation');
      }

      const data = await response.json();
      
      if (data.success) {
        setNavigation(prev => ({
          ...prev,
          currentPosition: currentPos,
          destination: data.navigation.destination,
          route: data.navigation.route,
          isTracking: true
        }));
        
        toast.success('Navigation GPS démarrée');
        startPositionTracking();
      } else {
        throw new Error(data.error || 'Erreur lors du démarrage');
      }
      
    } catch (error: any) {
      console.error('Erreur de navigation:', error);
      setError(error.message);
      toast.error('Impossible de démarrer la navigation GPS');
    } finally {
      setLoading(false);
    }
  };

  const startPositionTracking = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, heading } = position.coords;
        
        const newPosition: Location = {
          lat: latitude,
          lng: longitude,
          address: `${latitude}, ${longitude}`
        };

        // Mettre à jour l'état local
        setNavigation(prev => ({
          ...prev,
          currentPosition: newPosition,
          speed: (speed || 0) * 3.6, // Convertir m/s en km/h
          bearing: heading || 0
        }));

        // Envoyer la position au backend
        updateBackendPosition(latitude, longitude, speed || 0, heading || 0);
        
        // Calculer la distance restante
        if (navigation.destination) {
          const remainingDist = geocodingService.calculateDistance(
            latitude, longitude,
            navigation.destination.lat, navigation.destination.lng
          );
          
          setNavigation(prev => ({
            ...prev,
            remainingDistance: remainingDist
          }));

          // Vérifier si arrivé (moins de 100m)
          if (remainingDist < 0.1) {
            handleArrivalAtDestination();
          }
        }
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        toast.error('Erreur de localisation GPS');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000
      }
    );
  };

  const updateBackendPosition = async (lat: number, lng: number, speed: number, bearing: number) => {
    try {
      await fetch(`http://localhost:8000/api/trips/${tripId}/update-position/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          speed,
          bearing
        })
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de position:', error);
    }
  };

  const handleArrivalAtDestination = () => {
    toast.success('🎉 Arrivé à destination !');
    stopTracking();
    
    setTimeout(() => {
      navigate('/driver');
    }, 3000);
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    setNavigation(prev => ({
      ...prev,
      isTracking: false
    }));
  };

  const handleCompleteTrip = async () => {
    try {
      await tripService.completeTrip(parseInt(tripId!));
      toast.success('Voyage terminé avec succès');
      stopTracking();
      navigate('/driver');
    } catch (error) {
      toast.error('Erreur lors de la finalisation du voyage');
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const getProgressPercentage = (): number => {
    if (!navigation.route || !navigation.currentPosition || !navigation.destination) return 0;
    
    const totalDistance = navigation.route.distance_km;
    const remaining = navigation.remainingDistance;
    const completed = Math.max(0, totalDistance - remaining);
    
    return Math.min(100, (completed / totalDistance) * 100);
  };

  const getStatusDisplay = (status: Trip['status']): string => {
    switch (status) {
      case 'in_progress':
        return 'EN COURS';
      case 'completed':
        return 'TERMINÉ';
      case 'planned':
        return 'PLANIFIÉ';
      case 'cancelled':
        return 'ANNULÉ';
      default:
        return status;
    }
  };

  const getStatusSeverity = (status: Trip['status']): "success" | "info" | "warning" | "danger" | "secondary" => {
    switch (status) {
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      case 'planned':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <i className="pi pi-spin pi-spinner text-4xl mb-4 text-blue-600"></i>
          <p className="text-lg">Initialisation de la navigation GPS...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <i className="pi pi-exclamation-triangle text-4xl mb-4 text-red-500"></i>
            <h3 className="text-xl font-bold mb-2">Erreur de Navigation</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              label="Retour"
              icon="pi pi-arrow-left"
              onClick={() => navigate('/driver')}
              className="p-button-outlined"
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              icon="pi pi-arrow-left"
              className="p-button-text p-button-rounded"
              onClick={() => navigate('/driver')}
            />
            <div className="ml-3">
              <h1 className="text-lg font-semibold">Navigation GPS</h1>
              {trip && (
                <p className="text-sm text-gray-600">
                  {trip.origin} → {trip.destination}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge 
              value={navigation.isTracking ? "ACTIF" : "INACTIF"} 
              severity={navigation.isTracking ? "success" : "secondary"}
            />
            <Button
              label="Terminer"
              icon="pi pi-check"
              className="p-button-success p-button-sm"
              onClick={handleCompleteTrip}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-screen">
        {/* Carte de navigation */}
        <div className="flex-1 relative">
          {navigation.currentPosition && (
            <MapContainer
              center={[navigation.currentPosition.lat, navigation.currentPosition.lng]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapController
                center={[navigation.currentPosition.lat, navigation.currentPosition.lng]}
                zoom={15}
              />

              {/* Marqueur position actuelle */}
              <Marker position={[navigation.currentPosition.lat, navigation.currentPosition.lng]}>
                <Popup>
                  <div>
                    <strong>Position actuelle</strong>
                    <br />
                    Vitesse: {Math.round(navigation.speed)} km/h
                  </div>
                </Popup>
              </Marker>

              {/* Marqueur destination */}
              {navigation.destination && (
                <Marker position={[navigation.destination.lat, navigation.destination.lng]}>
                  <Popup>
                    <div>
                      <strong>Destination</strong>
                      <br />
                      {navigation.destination.address}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Tracé de la route */}
              {navigation.route && navigation.route.route_points && (
                <Polyline
                  positions={navigation.route.route_points.map(p => [p[0], p[1]])}
                  color="#2563eb"
                  weight={4}
                  opacity={0.7}
                />
              )}
            </MapContainer>
          )}
        </div>

        {/* Panneau d'informations */}
        <div className="w-full lg:w-96 bg-white shadow-lg">
          <div className="p-4 space-y-4">
            {/* Informations de progression */}
            <Panel header="Progression du voyage" className="mb-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progression</span>
                    <span>{Math.round(getProgressPercentage())}%</span>
                  </div>
                  <ProgressBar value={getProgressPercentage()} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Distance restante</div>
                    <div className="font-semibold text-lg">
                      {navigation.remainingDistance.toFixed(1)} km
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Vitesse actuelle</div>
                    <div className="font-semibold text-lg">
                      {Math.round(navigation.speed)} km/h
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Instructions de navigation */}
            <Panel header="Instructions" className="mb-4">
              <div className="space-y-3">
                {navigation.route && navigation.route.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <i className="pi pi-arrow-right text-blue-600 mt-1"></i>
                    <div>
                      <div className="font-medium">{instruction.instruction}</div>
                      <div className="text-sm text-gray-600">
                        {instruction.distance_km.toFixed(1)} km • {formatDuration(instruction.duration_minutes)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {!navigation.route && (
                  <div className="text-center text-gray-500 py-4">
                    <i className="pi pi-compass text-2xl mb-2"></i>
                    <p>Calcul de l'itinéraire en cours...</p>
                  </div>
                )}
              </div>
            </Panel>

            {/* Informations du voyage */}
            {trip && (
              <Panel header="Détails du voyage" className="mb-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-gray-600">Départ</div>
                    <div className="font-medium">{trip.origin}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Destination</div>
                    <div className="font-medium">{trip.destination}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Statut</div>
                    <Badge 
                      value={getStatusDisplay(trip.status)} 
                      severity={getStatusSeverity(trip.status)}
                    />
                  </div>
                </div>
              </Panel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;