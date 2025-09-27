import api from './api';

export interface DashboardData {
  user_info: {
    name: string;
    role: string;
    company: string;
    vehicle?: string;
  };
  stats: {
    [key: string]: number;
  };
  current_status?: {
    has_active_trip: boolean;
    current_trip: any;
    vehicle_status: string;
  };
  fleet_status?: {
    vehicles_in_use: number;
    vehicles_available: number;
    vehicles_maintenance: number;
  };
  recent_activity: {
    recent_trips: Array<{
      id: string;
      status: string;
      pickup_location: string;
      dropoff_location: string;
      driver_name: string;
      vehicle_number: string;
      created_at: string;
      actual_start_time?: string;
    }>;
    recent_users?: any[];
    active_drivers?: any[];
  };
  last_updated: string;
}

export const dashboardService = {
  getDashboardData: async () => {
    const response = await api.get('/trips/dashboard-data/');
    return response.data;
  },
};