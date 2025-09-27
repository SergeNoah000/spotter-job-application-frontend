import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Correction du problème des icônes par défaut de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Icônes personnalisées pour différents types de véhicules
const createTruckIcon = (color: string = '#3b82f6') => {
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">
      <span style="color: white; font-size: 14px;">🚛</span>
    </div>`,
    className: 'truck-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

const createDriverIcon = () => {
  return L.divIcon({
    html: `<div style="
      background-color: #10b981;
      border: 3px solid white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 6px rgba(0,0,0,0.4);
      animation: pulse 2s infinite;
    ">
      <span style="color: white; font-size: 16px; font-weight: bold;">📍</span>
    </div>
    <style>
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
    </style>`,
    className: 'driver-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

// Composant pour centrer automatiquement la carte sur la position du conducteur
const MapController: React.FC<{ 
  position: { lat: number; lng: number } | null;
  vehicles: any[];
}> = ({ position, vehicles }) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      // Centrer sur la position du conducteur
      map.setView([position.lat, position.lng], 13);
    } else if (vehicles.length > 0) {
      // Centrer sur les véhicules si pas de position conducteur
      const bounds = L.latLngBounds(
        vehicles.map(v => [v.latitude, v.longitude])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [position, vehicles, map]);

  return null;
};

interface RealTimeMapProps {
  position: { lat: number; lng: number } | null;
  vehicles: any[];
  height?: string;
  zoom?: number;
}

const RealTimeMap: React.FC<RealTimeMapProps> = ({ 
  position, 
  vehicles, 
  height = '400px',
  zoom = 13 
}) => {
  // Position par défaut (Paris) si pas de position
  const defaultCenter: [number, number] = position 
    ? [position.lat, position.lng] 
    : [48.8566, 2.3522];

  return (
    <div style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        {/* Couche de tuiles OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Contrôleur pour centrage automatique */}
        <MapController position={position} vehicles={vehicles} />
        
        {/* Marqueur pour la position du conducteur connecté */}
        {position && (
          <Marker 
            position={[position.lat, position.lng]} 
            icon={createDriverIcon()}
          >
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#10b981' }}>
                  📍 Votre Position
                </h4>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                  <strong>Lat:</strong> {position.lat.toFixed(6)}
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                  <strong>Lng:</strong> {position.lng.toFixed(6)}
                </p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                  🟢 Position mise à jour en temps réel
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Marqueurs pour les autres véhicules de la flotte */}
        {vehicles.map((vehicle, index) => {
          // Ne pas afficher le véhicule du conducteur connecté (éviter duplication)
          if (position && 
              Math.abs(vehicle.latitude - position.lat) < 0.0001 && 
              Math.abs(vehicle.longitude - position.lng) < 0.0001) {
            return null;
          }

          const iconColor = vehicle.operational_status === 'IN_USE' ? '#f59e0b' : '#3b82f6';
          
          return (
            <Marker
              key={`${vehicle.vehicle_id}-${index}`}
              position={[vehicle.latitude, vehicle.longitude]}
              icon={createTruckIcon(iconColor)}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>
                    🚛 {vehicle.vehicle_number}
                  </h4>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                    <strong>Modèle:</strong> {vehicle.make_model}
                  </p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                    <strong>Statut:</strong> 
                    <span style={{ 
                      color: vehicle.operational_status === 'IN_USE' ? '#f59e0b' : '#10b981',
                      fontWeight: '600',
                      marginLeft: '0.25rem'
                    }}>
                      {vehicle.operational_status === 'IN_USE' ? 'En Service' : 'Disponible'}
                    </span>
                  </p>
                  {vehicle.driver && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                      <strong>Conducteur:</strong> {vehicle.driver.name}
                    </p>
                  )}
                  <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#6b7280' }}>
                    📍 {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
                  </p>
                  {vehicle.last_update && (
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                      🕒 MAJ: {new Date(vehicle.last_update).toLocaleTimeString('fr-FR')}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Légende */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(255,255,255,0.95)',
        padding: '0.75rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontSize: '0.8rem',
        zIndex: 1000
      }}>
        <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Légende</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '16px' }}>📍</span>
          <span>Votre position</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#3b82f6', 
            borderRadius: '50%' 
          }}></div>
          <span>Véhicule disponible</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#f59e0b', 
            borderRadius: '50%' 
          }}></div>
          <span>Véhicule en service</span>
        </div>
      </div>
      
      {/* Indicateur nombre de véhicules */}
      {vehicles.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'rgba(59, 130, 246, 0.9)',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          fontSize: '0.9rem',
          fontWeight: '600',
          zIndex: 1000
        }}>
          🚛 {vehicles.length} véhicule{vehicles.length > 1 ? 's' : ''} en ligne
        </div>
      )}
    </div>
  );
};

export default RealTimeMap;