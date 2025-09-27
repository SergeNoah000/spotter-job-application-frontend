import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Vehicle, Trip } from '../../types';

// Configuration des icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Icône personnalisée pour les véhicules
const vehicleIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwNzVGRiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIi8+Cjwvc3ZnPgo=',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface VehicleMapProps {
  vehicles: Vehicle[];
  trips: Trip[];
  selectedVehicle?: Vehicle;
  onVehicleSelect?: (vehicle: Vehicle) => void;
  showRoutes?: boolean;
  height?: string;
}

// Composant pour ajuster la vue de la carte
const MapController: React.FC<{ vehicles: Vehicle[]; selectedVehicle?: Vehicle }> = ({ 
  vehicles, 
  selectedVehicle 
}) => {
  const map = useMap();

  useEffect(() => {
    if (selectedVehicle && selectedVehicle.current_location) {
      const [lat, lng] = selectedVehicle.current_location.split(',').map(Number);
      map.setView([lat, lng], 14);
    } else if (vehicles.length > 0) {
      const validVehicles = vehicles.filter(v => v.current_location);
      if (validVehicles.length > 0) {
        const bounds = L.latLngBounds(
          validVehicles.map(v => {
            const [lat, lng] = v.current_location!.split(',').map(Number);
            return [lat, lng] as [number, number];
          })
        );
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [vehicles, selectedVehicle, map]);

  return null;
};

const VehicleMap: React.FC<VehicleMapProps> = ({
  vehicles,
  trips,
  selectedVehicle,
  onVehicleSelect,
  showRoutes = false,
  height = '400px'
}) => {
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    // Obtenir la position actuelle de l'utilisateur
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn('Erreur de géolocalisation:', error);
          // Position par défaut (Paris)
          setCurrentPosition([48.8566, 2.3522]);
        }
      );
    } else {
      setCurrentPosition([48.8566, 2.3522]);
    }
  }, []);

  const getVehicleStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return '#28a745';
      case 'IN_USE': return '#007bff';
      case 'MAINTENANCE': return '#ffc107';
      case 'OUT_OF_SERVICE': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const createCustomIcon = (vehicle: Vehicle) => {
    const color = getVehicleStatusColor(vehicle.operational_status || 'AVAILABLE');
    return new L.Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg width="32" height="32" viewBox="0 0 32 32" fill="${color}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
          <text x="16" y="20" text-anchor="middle" fill="white" font-size="10" font-weight="bold">🚛</text>
        </svg>
      `)}`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  if (!currentPosition) {
    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Chargement de la carte...
    </div>;
  }

  return (
    <MapContainer
      center={currentPosition}
      zoom={10}
      style={{ height, width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapController vehicles={vehicles} selectedVehicle={selectedVehicle} />

      {/* Marqueurs des véhicules */}
      {vehicles
        .filter(vehicle => vehicle.current_location)
        .map(vehicle => {
          const [lat, lng] = vehicle.current_location!.split(',').map(Number);
          return (
            <Marker
              key={vehicle.id}
              position={[lat, lng]}
              icon={createCustomIcon(vehicle)}
              eventHandlers={{
                click: () => {
                  if (onVehicleSelect) {
                    onVehicleSelect(vehicle);
                  }
                },
              }}
            >
              <Popup>
                <div>
                  <h4>{vehicle.registration_number}</h4>
                  <p><strong>Modèle:</strong> {vehicle.make} {vehicle.model}</p>
                  <p><strong>Statut:</strong> {vehicle.operational_status}</p>
                  <p><strong>Conducteur:</strong> {vehicle.current_driver_name || 'Non assigné'}</p>
                  {vehicle.current_speed && (
                    <p><strong>Vitesse:</strong> {vehicle.current_speed} km/h</p>
                  )}
                  {vehicle.fuel_level && (
                    <p><strong>Carburant:</strong> {Math.round(vehicle.fuel_level)}%</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

      {/* Routes des trajets actifs */}
      {showRoutes && trips
        .filter(trip => trip.status === 'in_progress' && trip.route_points)
        .map(trip => {
          try {
            const routePoints = JSON.parse(trip.route_points!).map((point: any) => [
              point.lat, 
              point.lng
            ]);
            return (
              <Polyline
                key={trip.id}
                positions={routePoints}
                color="#007bff"
                weight={4}
                opacity={0.7}
              />
            );
          } catch (error) {
            console.warn('Erreur lors du parsing des points de route:', error);
            return null;
          }
        })}
    </MapContainer>
  );
};

export default VehicleMap;