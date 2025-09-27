import React from 'react';
import { Vehicle } from '../../types';
import { Car, Calendar, Hash, Wrench, Edit, Trash2 } from 'lucide-react';

interface VehicleListProps {
  vehicles: Vehicle[];
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: number) => void;
}

const VehicleList: React.FC<VehicleListProps> = ({ vehicles, onEdit, onDelete }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vehicles.length === 0 ? (
        <div className="col-span-full bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun véhicule trouvé</p>
          <p className="text-sm text-gray-400">Ajoutez votre premier véhicule pour commencer</p>
        </div>
      ) : (
        vehicles.map((vehicle) => (
          <div key={vehicle.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Car className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {vehicle.vehicle_number}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {vehicle.make} {vehicle.model}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(vehicle)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(vehicle.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Année: {vehicle.year}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Hash className="h-4 w-4 mr-2" />
                <span>Plaque: {vehicle.license_plate}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Wrench className="h-4 w-4 mr-2" />
                <span>VIN: {vehicle.vin.substring(0, 8)}...</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  vehicle.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {vehicle.is_active ? 'Disponible' : 'Indisponible'}
                </span>
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Voir détails
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default VehicleList;