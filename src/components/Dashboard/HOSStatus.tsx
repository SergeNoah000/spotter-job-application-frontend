import React from 'react';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { HOSStatus as HOSStatusType } from '../../types';

interface HOSStatusProps {
  status: HOSStatusType;
}

const HOSStatus: React.FC<HOSStatusProps> = ({ status }) => {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Clock className="h-5 w-5 mr-2" />
        Statut Hours of Service (HOS)
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Status */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-800">Statut Actuel</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Temps de conduite utilisé</span>
              <span className="font-semibold text-gray-900">
                {formatTime(status.drive_time_used)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Temps de service aujourd'hui</span>
              <span className="font-semibold text-gray-900">
                {formatTime(status.on_duty_time_today)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Temps restant - Conduite</span>
              <span className="font-semibold text-blue-600">
                {formatTime(status.remaining_drive_time)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Temps restant - Service</span>
              <span className="font-semibold text-blue-600">
                {formatTime(status.remaining_duty_time)}
              </span>
            </div>
          </div>
        </div>

        {/* Compliance Status */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-800">Conformité</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-gray-700">Limite quotidienne</span>
              </div>
              <span className="text-sm font-medium text-green-700">Conforme</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-gray-700">Limite hebdomadaire</span>
              </div>
              <span className="text-sm font-medium text-green-700">Conforme</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-sm text-gray-700">Pause obligatoire de 30 min</span>
              </div>
              <span className="text-sm font-medium text-yellow-700">Attention</span>
            </div>
          </div>
        </div>
      </div>

      {/* Violations */}
      {status.violations && status.violations.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-medium text-gray-800 mb-3">Violations détectées</h3>
          <div className="space-y-2">
            {status.violations.map((violation, index) => (
              <div key={index} className="flex items-center p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-sm text-red-700">{violation.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HOSStatus;