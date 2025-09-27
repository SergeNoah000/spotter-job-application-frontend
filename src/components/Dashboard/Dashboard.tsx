import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { vehicleService, tripService, eldService, websocketService } from '../../services/api';
import { Vehicle, Trip, ELDLog } from '../../types';

interface WebSocketData {
  type: string;
  vehicle?: Vehicle;
  trip?: Trip;
}

const Dashboard: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [eldLogs, setEldLogs] = useState<ELDLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // WebSocket pour les mises à jour en temps réel
    const unsubscribe = websocketService.subscribeToVehicleUpdates((data: WebSocketData) => {
      if (data.type === 'vehicle_update' && data.vehicle) {
        setVehicles(prev => prev.map(v => 
          v.id === data.vehicle!.id ? { ...v, ...data.vehicle } : v
        ));
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [vehiclesData, tripsData, eldData] = await Promise.all([
        vehicleService.getVehicles(),
        tripService.getTrips(),
        eldService.getELDLogs()
      ]);
      
      setVehicles(vehiclesData);
      setTrips(tripsData);
      setEldLogs(eldData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActiveVehicles = () => vehicles.filter(v => v.operational_status === 'AVAILABLE' || v.operational_status === 'IN_USE');
  const getActiveTrips = () => trips.filter(t => t.status === 'in_progress');
  const getCompletedTrips = () => trips.filter(t => t.status === 'completed');

  const statusLabels: Record<string, string> = {
    in_progress: 'En cours',
    planned: 'Planifié',
    completed: 'Terminé',
    cancelled: 'Annulé'
  };

  const getStatusSeverity = (status: string): "success" | "info" | "warning" | "danger" | "secondary" | null | undefined => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'planned': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const renderTripStatus = (trip: Trip) => {
    return (
      <Badge
        value={statusLabels[trip.status] || trip.status}
        severity={getStatusSeverity(trip.status)}
      />
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <i className="pi pi-spin pi-spinner text-4xl"></i>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Véhicules Actifs</h3>
                  <p className="text-3xl font-bold">{getActiveVehicles().length}</p>
                </div>
                <i className="pi pi-car text-4xl opacity-80"></i>
              </div>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Voyages Actifs</h3>
                  <p className="text-3xl font-bold">{getActiveTrips().length}</p>
                </div>
                <i className="pi pi-map text-4xl opacity-80"></i>
              </div>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Voyages Terminés</h3>
                  <p className="text-3xl font-bold">{getCompletedTrips().length}</p>
                </div>
                <i className="pi pi-check-circle text-4xl opacity-80"></i>
              </div>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Total Véhicules</h3>
                  <p className="text-3xl font-bold">{vehicles.length}</p>
                </div>
                <i className="pi pi-database text-4xl opacity-80"></i>
              </div>
            </Card>
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            <Card title="Voyages Récents">
              <DataTable value={trips.slice(0, 5)} size="small">
                <Column field="origin" header="Origine" />
                <Column field="destination" header="Destination" />
                <Column 
                  field="status" 
                  header="Statut" 
                  body={renderTripStatus}
                />
                <Column 
                  field="start_time" 
                  header="Date" 
                  // body={(trip) => format(new Date(trip.start_time), 'dd/MM/yyyy')}
                />
              </DataTable>
            </Card>

            <Card title="Logs ELD Récents">
              <DataTable value={eldLogs.slice(0, 5)} size="small">
                <Column 
                  field="vehicle" 
                  header="Véhicule" 
                  body={(log: ELDLog) => (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {log.vehicle_name || `Véhicule ${log.vehicle}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(log.log_date), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  )}
                />
                <Column 
                  field="duty_status" 
                  header="Statut" 
                  body={(log: ELDLog) => (
                    <Badge 
                      value={log.duty_status.replace('_', ' ')} 
                      severity={log.duty_status === 'driving' ? 'success' : 'info'}
                    />
                  )}
                />
                <Column field="location" header="Localisation" />
              </DataTable>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;