import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  FileText, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  MapPin,
  Fuel
} from 'lucide-react';
import { vehicleService, eldService, tripService } from '../services/api';
import { Vehicle, ELDLog, Trip } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  todayLogs: number;
  activeTrips: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    activeVehicles: 0,
    todayLogs: 0,
    activeTrips: 0
  });
  const [recentLogs, setRecentLogs] = useState<ELDLog[]>([]);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les données en parallèle
        const [vehicles, logs, trips] = await Promise.all([
          vehicleService.getVehicles(),
          eldService.getELDLogs(),
          tripService.getTrips()
        ]);

        // Calculer les statistiques
        const activeVehicles = vehicles.filter(v => v.is_active).length;
        const today = new Date().toISOString().split('T')[0];
        const todayLogs = logs.filter(log => 
          log.log_date === today
        ).length;
        const activeTrips = trips.filter(trip => 
          trip.status === 'in_progress'
        ).length;

        setStats({
          totalVehicles: vehicles.length,
          activeVehicles,
          todayLogs,
          activeTrips
        });

        // Récupérer les logs récents (5 derniers)
        setRecentLogs(logs.slice(0, 5));
        
        // Récupérer les voyages récents (5 derniers)
        setRecentTrips(trips.slice(0, 5));

      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getDutyStatusText = (status: string) => {
    switch (status) {
      case 'ON_DUTY':
        return 'En service';
      case 'OFF_DUTY':
        return 'Hors service';
      case 'DRIVING':
        return 'Conduite';
      case 'SLEEPER_BERTH':
        return 'Couchette';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRIVING':
        return 'text-green-600 bg-green-100';
      case 'ON_DUTY':
        return 'text-blue-600 bg-blue-100';
      case 'OFF_DUTY':
        return 'text-gray-600 bg-gray-100';
      case 'SLEEPER_BERTH':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Truck className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Véhicules Totaux
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalVehicles}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Véhicules Actifs
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activeVehicles}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Logs Aujourd'hui
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.todayLogs}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPin className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Voyages Actifs
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activeTrips}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sections récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logs ELD récents */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Logs ELD Récents
            </h3>
            {recentLogs.length > 0 ? (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {log.vehicle_name || `Véhicule ${log.vehicle}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(log.log_date), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.duty_status)}`}>
                      {getDutyStatusText(log.duty_status)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucun log récent</p>
            )}
          </div>
        </div>

        {/* Voyages récents */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Voyages Récents
            </h3>
            {recentTrips.length > 0 ? (
              <div className="space-y-3">
                {recentTrips.map((trip) => (
                  <div key={trip.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {trip.origin} → {trip.destination}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(trip.start_time), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      trip.status === 'in_progress' 
                        ? 'text-green-600 bg-green-100' 
                        : trip.status === 'completed'
                        ? 'text-blue-600 bg-blue-100'
                        : 'text-gray-600 bg-gray-100'
                    }`}>
                      {trip.status === 'in_progress' ? 'En cours' : 
                       trip.status === 'completed' ? 'Terminé' : 
                       trip.status === 'planned' ? 'Planifié' : trip.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucun voyage récent</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;