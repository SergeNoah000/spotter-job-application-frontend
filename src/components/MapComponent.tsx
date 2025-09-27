import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  lat: number;
  lng: number;
  timestamp?: string;
}

interface MapComponentProps {
  currentLocation?: Location;
  route?: Location[];
  destinations?: Location[];
  height?: string;
  zoom?: number;
}

const MapComponent: React.FC<MapComponentProps> = ({
  currentLocation,
  route = [],
  destinations = [],
  height = '400px',
  zoom = 13
}) => {
  const [center, setCenter] = useState<[number, number]>([45.5017, -73.5673]); // Montréal par défaut

  useEffect(() => {
    if (currentLocation) {
      setCenter([currentLocation.lat, currentLocation.lng]);
    }
  }, [currentLocation]);

  // Icône personnalisée pour le véhicule
  const truckIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  // Icône pour les destinations
  const destinationIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Position actuelle du véhicule */}
        {currentLocation && (
          <Marker
            position={[currentLocation.lat, currentLocation.lng]}
            icon={truckIcon}
          >
            <Popup>
              <div>
                <strong>Position actuelle</strong>
                <br />
                Lat: {currentLocation.lat.toFixed(6)}
                <br />
                Lng: {currentLocation.lng.toFixed(6)}
                {currentLocation.timestamp && (
                  <>
                    <br />
                    Heure: {new Date(currentLocation.timestamp).toLocaleTimeString()}
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route tracée */}
        {route.length > 1 && (
          <Polyline
            positions={route.map(loc => [loc.lat, loc.lng])}
            color="blue"
            weight={4}
            opacity={0.7}
          />
        )}

        {/* Destinations */}
        {destinations.map((dest, index) => (
          <Marker
            key={index}
            position={[dest.lat, dest.lng]}
            icon={destinationIcon}
          >
            <Popup>
              <div>
                <strong>Destination {index + 1}</strong>
                <br />
                Lat: {dest.lat.toFixed(6)}
                <br />
                Lng: {dest.lng.toFixed(6)}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;