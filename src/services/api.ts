import axios from 'axios';
import { 
  User, 
  Company, 
  Vehicle, 
  Trip, 
  ELDLog, 
  HOSViolation,
  LoginCredentials,
  RegisterData,
  DashboardStats 
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

// Configuration Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer l'expiration du token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
            refresh: refreshToken,
          });
          localStorage.setItem('access_token', response.data.access);
          // Retry la requête originale
          return api.request(error.config);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Services d'authentification
export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/accounts/login/', credentials);
    const { access, refresh, user } = response.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    return user;
  },

  register: async (data: RegisterData) => {
    const response = await api.post('/accounts/register/', data);
    return response.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await api.post('/accounts/logout/', { refresh: refreshToken });
      } catch (error) {
        // Ignorer les erreurs de logout
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/accounts/profile/');
    return response.data;
  },
};

// Services utilisateurs
export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/accounts/users/');
    return response.data.results || response.data;
  },

  getUser: async (id: number): Promise<User> => {
    const response = await api.get(`/accounts/users/${id}/`);
    return response.data;
  },

  createUser: async (userData: any): Promise<User> => {
    // Pour FormData, ne pas définir Content-Type - le navigateur le fera automatiquement
    const config = userData instanceof FormData ? {} : {};
    const response = await api.post('/accounts/users/', userData, config);
    return response.data;
  },

  updateUser: async (id: number, data: Partial<User>): Promise<User> => {
    const response = await api.put(`/accounts/users/${id}/`, data);
    return response.data;
  },
};

// Services entreprises
export const companyService = {
  getCompanies: async (): Promise<Company[]> => {
    const response = await api.get('/accounts/companies/');
    return response.data.results || response.data;
  },

  createCompany: async (data: Omit<Company, 'id'>): Promise<Company> => {
    const response = await api.post('/accounts/companies/', data);
    return response.data;
  },
};

// Services véhicules
export const vehicleService = {
  getVehicles: (): Promise<Vehicle[]> => api.get('/trips/vehicles/').then(res => res.data.results || res.data),
  getVehicle: (id: number): Promise<Vehicle> => api.get(`/trips/vehicles/${id}/`).then(res => res.data),
  
  createVehicle: async (data: any): Promise<Vehicle> => {
    // Détecter si c'est FormData (pour les uploads d'images) ou un objet normal
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    const response = await api.post('/trips/vehicles/', data, config);
    return response.data;
  },
  
  updateVehicle: async (id: number, data: any): Promise<Vehicle> => {
    // Pour FormData, ne pas définir Content-Type - le navigateur le fera automatiquement avec boundary
    const config = data instanceof FormData ? {} : {};
    const response = await api.patch(`/trips/vehicles/${id}/`, data, config);
    return response.data;
  },
  
  deleteVehicle: (id: number): Promise<void> => 
    api.delete(`/trips/vehicles/${id}/`).then(res => res.data),
};

// Vehicles API
export const vehiclesApi = {
  getAll: () => api.get('/trips/vehicles/'),
  getById: (id: number) => api.get(`/trips/vehicles/${id}/`),
  create: (data: FormData) => {
    // Ne pas définir Content-Type manuellement pour FormData
    // Le navigateur doit le faire automatiquement avec le bon boundary
    return api.post('/trips/vehicles/', data);
  },
  update: (id: number, data: FormData) => {
    return api.put(`/trips/vehicles/${id}/`, data);
  },
  delete: (id: number) => api.delete(`/trips/vehicles/${id}/`)
};

export const createVehicle = async (vehicleData: FormData): Promise<Vehicle> => {
  const response = await api.post('/trips/vehicles/', vehicleData);
  return response.data;
};

export const updateVehicle = async (id: number, vehicleData: FormData): Promise<Vehicle> => {
  const response = await api.put(`/trips/vehicles/${id}/`, vehicleData);
  return response.data;
};

// Services voyages
export const tripService = {
  getTrips: (): Promise<Trip[]> => api.get('/trips/').then(res => res.data.results || res.data),
  getTrip: (id: number): Promise<Trip> => api.get(`/trips/${id}/`).then(res => res.data),
  createTrip: (data: Omit<Trip, 'id' | 'created_at' | 'updated_at'>): Promise<Trip> => 
    api.post('/trips/', data).then(res => res.data),
  updateTrip: (id: number, data: Partial<Trip>): Promise<Trip> => 
    api.patch(`/trips/${id}/`, data).then(res => res.data),
  deleteTrip: (id: number): Promise<void> => 
    api.delete(`/trips/${id}/`).then(res => res.data),
  startTrip: (id: number): Promise<Trip> => 
    api.post(`/trips/${id}/start/`).then(res => res.data),
  endTrip: (id: number): Promise<Trip> => 
    api.post(`/trips/${id}/complete/`).then(res => res.data),
  completeTrip: (id: number): Promise<Trip> => 
    api.post(`/trips/${id}/complete/`).then(res => res.data),
  getDriverTrips: (): Promise<Trip[]> => 
    api.get('/trips/?driver=me').then(res => res.data.results || res.data),
};

// Service ELD amélioré
export const eldService = {
  // Logs ELD basiques
  getELDLogs: async (): Promise<ELDLog[]> => {
    const response = await api.get('/eld/logs/');
    return response.data.results || response.data;
  },

  createELDLog: async (data: Omit<ELDLog, 'id'>): Promise<ELDLog> => {
    const response = await api.post('/eld/logs/', data);
    return response.data;
  },

  // Gestion du statut HOS
  createHOSStatusChange: async (statusData: {
    duty_status: string;
    location?: string;
    notes?: string;
  }) => {
    const response = await api.post('/eld/hos/status-change/', statusData);
    return response.data;
  },

  getCurrentHOSStatus: async () => {
    const response = await api.get('/eld/hos/current-status/');
    return response.data;
  },

  getDailyLogs: async (date?: string, driverId?: string) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (driverId) params.append('driver_id', driverId);
    
    const response = await api.get(`/eld/logs/daily/?${params.toString()}`);
    return response.data;
  },

  getHOSViolations: async (): Promise<HOSViolation[]> => {
    const response = await api.get('/eld/violations/');
    return response.data.results || response.data;
  },
};

// Service de navigation GPS
export const navigationService = {
  // Démarrer la navigation GPS pour un voyage
  startTripNavigation: async (tripId: string, currentPosition: { lat: number; lng: number }) => {
    const response = await api.post(`/trips/${tripId}/start-navigation/`, {
      current_latitude: currentPosition.lat,
      current_longitude: currentPosition.lng
    });
    return response.data;
  },

  // Mettre à jour la position pendant la navigation
  updateNavigationPosition: async (tripId: string, positionData: {
    latitude: number;
    longitude: number;
    speed?: number;
    bearing?: number;
  }) => {
    const response = await api.post(`/trips/${tripId}/update-position/`, positionData);
    return response.data;
  },

  // Rechercher des adresses avec autocomplétion
  searchAddresses: async (query: string) => {
    const response = await api.get('/trips/locations/search/', {
      params: { q: query }
    });
    return response.data;
  },

  // Géocodage inverse (coordonnées vers adresse)
  reverseGeocode: async (lat: number, lng: number) => {
    const response = await api.post('/trips/locations/reverse-geocode/', {
      latitude: lat,
      longitude: lng
    });
    return response.data;
  },

  // Calculer un itinéraire
  calculateRoute: async (origin: any, destination: any, waypoints?: any[]) => {
    const response = await api.post('/trips/navigation/calculate-route/', {
      origin,
      destination,
      waypoints: waypoints || []
    });
    return response.data;
  },

  // Obtenir le statut de suivi d'un voyage
  getTripTrackingStatus: async (tripId: string) => {
    const response = await api.get(`/trips/${tripId}/tracking-status/`);
    return response.data;
  },

  // Navigation et directions
  getDirections: async (origin: string, destination: string) => {
    const response = await api.get('/trips/navigation/directions/', {
      params: { origin, destination }
    });
    return response.data;
  },

  getOptimalRoute: async (waypoints: string[]) => {
    const response = await api.post('/trips/navigation/optimize-route/', {
      waypoints
    });
    return response.data;
  },

  updateRouteProgress: async (tripId: number, currentPosition: {lat: number, lng: number}) => {
    const response = await api.post(`/trips/${tripId}/update-progress/`, {
      latitude: currentPosition.lat,
      longitude: currentPosition.lng
    });
    return response.data;
  },
};

// Service dashboard
export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/trips/dashboard/stats/');
    return response.data;
  },

  getHOSStatus: async () => {
    const response = await api.get('/trips/dashboard/hos-status/');
    return response.data;
  },
};

// Service d'assignation véhicule-conducteur
export const assignmentService = {
  assignDriverToVehicle: async (vehicleId: string, driverId: string) => {
    const response = await api.post('/trips/vehicles/assign-driver/', {
      vehicle_id: vehicleId,
      driver_id: driverId
    });
    return response.data;
  },

  unassignDriverFromVehicle: async (vehicleId: string) => {
    const response = await api.post('/trips/vehicles/unassign-driver/', {
      vehicle_id: vehicleId
    });
    return response.data;
  },

  getAvailableDrivers: async () => {
    const response = await api.get('/trips/available-drivers/');
    return response.data;
  },

  getAvailableVehicles: async () => {
    const response = await api.get('/trips/available-vehicles/');
    return response.data;
  },
};

// Service de géolocalisation temps réel
export const locationService = {
  updateVehiclePosition: async (latitude: number, longitude: number) => {
    const response = await api.post('/trips/vehicles/update-position/', {
      latitude,
      longitude
    });
    return response.data;
  },

  getVehiclePositions: async () => {
    const response = await api.get('/trips/vehicles/positions/');
    return response.data;
  },

  startTracking: async (tripId: number) => {
    const response = await api.post(`/trips/${tripId}/start-tracking/`);
    return response.data;
  },

  stopTracking: async (tripId: number) => {
    const response = await api.post(`/trips/${tripId}/stop-tracking/`);
    return response.data;
  },

  getTrackingHistory: async (tripId: number) => {
    const response = await api.get(`/trips/${tripId}/tracking-history/`);
    return response.data;
  },
};

// Service de notifications temps réel
export const notificationService = {
  getNotifications: async () => {
    const response = await api.get('/accounts/notifications/');
    return response.data;
  },

  markAsRead: async (notificationId: number) => {
    const response = await api.patch(`/accounts/notifications/${notificationId}/`, {
      is_read: true
    });
    return response.data;
  },

  subscribeToUpdates: (callback: (data: any) => void) => {
    // Implémentation WebSocket pour les notifications temps réel
    const ws = new WebSocket('ws://localhost:8000/ws/notifications/');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };

    return () => ws.close();
  },
};

// Service de rapports
export const reportService = {
  generateHOSReport: async (dateRange: { start: string, end: string }, driverId?: number) => {
    const params = new URLSearchParams({
      start_date: dateRange.start,
      end_date: dateRange.end,
      ...(driverId && { driver_id: driverId.toString() })
    });
    
    const response = await api.get(`/eld/reports/hos/?${params.toString()}`);
    return response.data;
  },

  generateTripReport: async (dateRange: { start: string, end: string }) => {
    const params = new URLSearchParams({
      start_date: dateRange.start,
      end_date: dateRange.end
    });
    
    const response = await api.get(`/trips/reports/trips/?${params.toString()}`);
    return response.data;
  },

  exportPDF: async (reportType: string, reportId: number) => {
    const response = await api.get(`/reports/${reportType}/${reportId}/pdf/`, {
      responseType: 'blob'
    });
    
    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}-report-${reportId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return response.data;
  },
};

// Service WebSocket pour le tracking temps réel
export const websocketService = {
  connect: (tripId?: number) => {
    const wsUrl = tripId 
      ? `ws://localhost:8000/ws/tracking/${tripId}/`
      : 'ws://localhost:8000/ws/general/';
    
    return new WebSocket(wsUrl);
  },

  subscribeToVehicleUpdates: (callback: (data: any) => void) => {
    const ws = new WebSocket('ws://localhost:8000/ws/vehicles/');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => ws.close();
  },

  subscribeToTripUpdates: (callback: (data: any) => void) => {
    const ws = new WebSocket('ws://localhost:8000/ws/trips/');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => ws.close();
  },
};

// Service spécial conducteur
export const driverService = {
  getCurrentTrip: async () => {
    const response = await api.get('/trips/driver/current-trip/');
    return response.data;
  },

  createTrip: async (tripData: any) => {
    const response = await api.post('/trips/', tripData);
    return response.data;
  },

  startTrip: async (tripId: string) => {
    const response = await api.post(`/trips/${tripId}/start/`);
    return response.data;
  },

  completeTrip: async (tripId: string) => {
    const response = await api.post(`/trips/${tripId}/complete/`);
    return response.data;
  },
};

export default api;