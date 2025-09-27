import axios from 'axios';

export interface GeocodingResult {
  place_id: string;
  display_name: string;
  lat: string;
  lng: string;
  type: string;
  importance: number;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  bbox: string[];
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface RouteData {
  distance_km: number;
  duration_minutes: number;
  polyline: string;
  route_points: number[][];
  instructions: Array<{
    instruction: string;
    distance_km: number;
    duration_minutes: number;
  }>;
  bbox: number[];
}

class GeocodingService {
  private baseURL = 'http://localhost:8000/api/trips';

  /**
   * Rechercher des adresses avec autocomplétion
   */
  async searchAddress(query: string): Promise<GeocodingResult[]> {
    if (query.length < 3) {
      return [];
    }

    try {
      const response = await axios.get(`${this.baseURL}/locations/search/`, {
        params: { q: query },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      return response.data.suggestions || [];
    } catch (error) {
      console.error('Erreur lors de la recherche d\'adresses:', error);
      return [];
    }
  }

  /**
   * Géocodage inverse : coordonnées vers adresse
   */
  async reverseGeocode(lat: number, lng: number): Promise<Location | null> {
    try {
      const response = await axios.post(
        `${this.baseURL}/locations/reverse-geocode/`,
        { latitude: lat, longitude: lng },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      if (response.data.success) {
        return {
          lat,
          lng,
          address: response.data.address.display_name
        };
      }
      return null;
    } catch (error) {
      console.error('Erreur lors du géocodage inverse:', error);
      return null;
    }
  }

  /**
   * Calculer un itinéraire entre deux points
   */
  async calculateRoute(origin: Location, destination: Location, waypoints: Location[] = []): Promise<RouteData | null> {
    try {
      const response = await axios.post(
        `${this.baseURL}/navigation/calculate-route/`,
        {
          origin: {
            lat: origin.lat,
            lng: origin.lng,
            address: origin.address
          },
          destination: {
            lat: destination.lat,
            lng: destination.lng,
            address: destination.address
          },
          waypoints: waypoints.map(wp => ({
            lat: wp.lat,
            lng: wp.lng,
            address: wp.address
          }))
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      if (response.data.success) {
        return response.data.route;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors du calcul d\'itinéraire:', error);
      return null;
    }
  }

  /**
   * Obtenir la position actuelle de l'utilisateur
   */
  async getCurrentPosition(): Promise<Location | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const address = await this.reverseGeocode(latitude, longitude);
          
          resolve({
            lat: latitude,
            lng: longitude,
            address: address?.address || `${latitude}, ${longitude}`
          });
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Surveiller la position en temps réel
   */
  watchPosition(
    onPositionUpdate: (position: Location) => void,
    onError?: (error: GeolocationPositionError) => void
  ): number {
    if (!navigator.geolocation) {
      throw new Error('La géolocalisation n\'est pas supportée');
    }

    return navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        onPositionUpdate({
          lat: latitude,
          lng: longitude,
          address: `${latitude}, ${longitude}`
        });
      },
      onError,
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000
      }
    );
  }

  /**
   * Arrêter la surveillance de position
   */
  clearWatch(watchId: number): void {
    navigator.geolocation.clearWatch(watchId);
  }

  /**
   * Calculer la distance entre deux points (en km)
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Instance singleton
export const geocodingService = new GeocodingService();
export default geocodingService;