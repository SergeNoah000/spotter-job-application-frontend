import React, { useState, useEffect } from 'react';
import { eldService } from '../../services/api';
import { ELDLog } from '../../types';
import { FileText, Calendar, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ELDLogList: React.FC = () => {
  const [logs, setLogs] = useState<ELDLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await eldService.getELDLogs();
        setLogs(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const getDutyStatusText = (status: string) => {
    switch (status) {
      case 'off_duty': return 'Hors service';
      case 'sleeper_berth': return 'Couchette';
      case 'driving': return 'Conduite';
      case 'on_duty_not_driving': return 'En service (pas de conduite)';
      default: return status;
    }
  };

  const getDutyStatusColor = (status: string) => {
    switch (status) {
      case 'off_duty': return 'bg-gray-100 text-gray-800';
      case 'sleeper_berth': return 'bg-blue-100 text-blue-800';
      case 'driving': return 'bg-green-100 text-green-800';
      case 'on_duty_not_driving': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-700">Erreur lors du chargement des logs ELD: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Journaux ELD</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {logs.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun journal ELD trouvé</p>
              <p className="text-sm text-gray-400">Les journaux apparaîtront ici une fois générés</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          Journal #{log.id}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDutyStatusColor(log.duty_status)}`}>
                          {getDutyStatusText(log.duty_status)}
                        </span>
                      </div>
                      
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{format(new Date(log.log_date), 'dd/MM/yyyy', { locale: fr })}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{log.start_time}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{log.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {log.notes && (
                  <div className="mt-3 ml-14">
                    <p className="text-sm text-gray-600">{log.notes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ELDLogList;