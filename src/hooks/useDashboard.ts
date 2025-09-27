import { useState, useEffect } from 'react';
import { dashboardService, DashboardData } from '../services/dashboardService';
import toast from 'react-hot-toast';

const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du dashboard');
      toast.error('Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Rafraîchir les données toutes les 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    dashboardData,
    stats: dashboardData?.stats || null,
    userInfo: dashboardData?.user_info || null,
    recentActivity: dashboardData?.recent_activity || null,
    currentStatus: dashboardData?.current_status || null,
    fleetStatus: dashboardData?.fleet_status || null,
    loading,
    error,
    fetchDashboardData
  };
};

export default useDashboard;