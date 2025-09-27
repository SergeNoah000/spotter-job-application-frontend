// Types pour l'authentification
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  company: number;
  company_name?: string;
  role: 'driver' | 'dispatcher' | 'admin';
  user_type?: 'DRIVER' | 'FLEET_MANAGER' | 'ADMIN';
  phone_number?: string;
  cdl_number?: string;
  is_active: boolean;
  date_joined: string;
  avatar?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  
  // Champs véhicule pour conducteurs
  assigned_vehicle_info?: {
    id: string;
    vehicle_number: string;
    make: string;
    model: string;
    year: number;
    operational_status: string;
    current_location: string;
    last_location_update?: string;
    can_start_trip: boolean;
  };
  vehicle_status?: string;
  vehicle_location?: string;
  has_assigned_vehicle?: boolean;
  can_start_trip?: boolean;
  has_active_trip?: boolean;
  current_hos_hours?: number;
  available_driving_hours?: number;
  
  // Permissions
  can_manage_users?: boolean;
  can_create_trips?: boolean;
  
  created_at?: string;
  updated_at?: string;
}

export interface Company {
  id: number;
  name: string;
  dot_number: string;
  mc_number?: string;
  address: string;
  phone: string;
  email: string;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company_name: string;
  dot_number: string;
  mc_number?: string;
  address: string;
  phone: string;
  company_email: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

// Types pour les véhicules
export interface Vehicle {
  id: number;
  vehicle_number: string;  // Changé de unit_number à vehicle_number
  make: string;
  model: string;
  year: number;
  vin: string;
  license_plate: string;
  company: number;
  company_name?: string;
  vehicle_type?: string;
  front_image?: string;
  side_image?: string;
  rear_image?: string;
  is_active: boolean;
  
  // Nouveaux champs d'assignation
  assigned_driver?: number;
  assigned_driver_name?: string;
  assigned_driver_info?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    cdl_number?: string;
    has_active_trip: boolean;
    current_hos_hours: number;
    available_driving_hours: number;
  };
  is_assigned?: boolean;
  can_start_trip?: boolean;
  
  // Statut opérationnel
  operational_status?: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  
  // Géolocalisation
  current_latitude?: number;
  current_longitude?: number;
  current_location?: string; // Format: "lat,lng" ou adresse
  current_location_display?: string;
  last_location_update?: string;
  
  // Propriétés manquantes pour la carte
  registration_number?: string;
  current_driver_name?: string;
  current_speed?: number;
  fuel_level?: number;
  
  created_at: string;
  updated_at: string;
}

// Types pour les voyages
export interface Trip {
  id: number;
  driver: number;
  vehicle: number;
  vehicle_details?: Vehicle;
  origin: string;
  destination: string;
  start_location: string;
  end_location: string;
  start_time: string;
  end_time?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  distance?: number;
  total_miles?: number;
  notes?: string;
  route_points?: string; // JSON string contenant les points de route
  created_at: string;
  updated_at: string;
}

export type TripStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

// Types pour les logs ELD
export interface ELDLog {
  id: number;
  driver: number;
  vehicle: number;
  vehicle_name?: string; // Propriété optionnelle pour le nom du véhicule
  log_date: string;
  start_time: string; // Champ manquant ajouté
  duty_status: 'off_duty' | 'sleeper_berth' | 'driving' | 'on_duty_not_driving';
  location: string;
  odometer_reading?: number;
  engine_hours?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type DutyStatus = 'off_duty' | 'sleeper_berth' | 'driving' | 'on_duty_not_driving';

// Types pour le dashboard
export interface DashboardStats {
  total_trips: number;
  active_trips: number;
  completed_trips: number;
  total_vehicles: number;
  active_vehicles: number;
  total_drivers: number;
  active_drivers: number;
  violations_count: number;
  recent_trips: Trip[];
  recent_violations: HOSViolation[];
}

// Types pour le statut HOS (Hours of Service)
export interface HOSStatus {
  driver_id: number;
  drive_time_used: number; // en minutes
  drive_time_remaining: number; // en minutes
  remaining_drive_time: number; // en minutes
  duty_time_used: number; // en minutes
  duty_time_remaining: number; // en minutes
  remaining_duty_time: number; // en minutes
  cycle_time_used: number; // en minutes
  cycle_time_remaining: number; // en minutes
  last_break: string;
  next_required_break: string;
  violations: HOSViolation[];
  current_status: DutyStatus;
  status_start_time: string;
  on_duty_time_used: number; // en minutes
  on_duty_time_today: number; // en minutes
  shift_time_used: number; // en minutes
  on_duty_time_remaining: number; // en minutes
  shift_time_remaining: number; // en minutes
  next_break_required?: string; // ISO datetime
}

export interface HOSViolation {
  id: number;
  driver: number;
  violation_type: 'drive_time' | 'duty_time' | 'cycle_time' | 'break_required';
  description: string;
  occurred_at: string;
  resolved: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Types pour les API responses
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
  success: boolean;
  error?: string;
}

// Types pour les formulaires
export interface TripFormData {
  vehicle: number;
  origin: string;
  destination: string;
  start_location: string;
  end_location: string;
  start_time: string;
  notes?: string;
}

export interface VehicleFormData {
  vehicle_number: string;  // Changé de unit_number à vehicle_number
  make: string;
  model: string;
  year: number;
  vin: string;
  license_plate: string;
  company: number;
  vehicle_type?: string;
  front_image?: File;
  side_image?: File;
  rear_image?: File;
}

export interface ELDLogFormData {
  vehicle: number;
  duty_status: DutyStatus;
  location: string;
  odometer_reading?: number;
  engine_hours?: number;
  notes?: string;
}

// Types pour les contextes
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// Types d'erreur personnalisés
export interface ApiError {
  message: string;
  status?: number;
  field?: string;
}

export interface FormError {
  [key: string]: string[];
}

// Types pour les composants
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface FilterOption {
  label: string;
  value: string | number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// Énumérations
export enum UserRole {
  DRIVER = 'driver',
  DISPATCHER = 'dispatcher',
  ADMIN = 'admin'
}

export enum ViolationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Types utilitaires
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Types pour les hooks personnalisés
export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseFormResult<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  handleChange: (name: keyof T, value: any) => void;
  handleBlur: (name: keyof T) => void;
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (e: React.FormEvent) => void;
  resetForm: () => void;
  setFieldValue: (name: keyof T, value: any) => void;
  setFieldError: (name: keyof T, error: string) => void;
  isValid: boolean;
  isDirty: boolean;
}