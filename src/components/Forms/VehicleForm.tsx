import React, { useState, useRef } from 'react';
import { Vehicle } from '../../types';

interface VehicleFormProps {
  vehicle?: Vehicle;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({
  vehicle,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    vehicle_number: vehicle?.vehicle_number || '',
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    year: vehicle?.year || new Date().getFullYear(),
    vin: vehicle?.vin || '',
    license_plate: vehicle?.license_plate || '',
    company: vehicle?.company || '',
    vehicle_type: vehicle?.vehicle_type || 'STRAIGHT_TRUCK'
  });

  const [images, setImages] = useState<{
    front_image?: File;
    side_image?: File;
    rear_image?: File;
  }>({});

  const frontImageRef = useRef<HTMLInputElement>(null);
  const sideImageRef = useRef<HTMLInputElement>(null);
  const rearImageRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, imageType: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setImages(prev => ({
        ...prev,
        [imageType]: file
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitFormData = new FormData();
    
    // Ajouter tous les champs de données
    Object.entries(formData).forEach(([key, value]) => {
      submitFormData.append(key, value.toString());
    });

    // Ajouter les images si elles existent
    if (images.front_image) {
      submitFormData.append('front_image', images.front_image);
    }
    if (images.side_image) {
      submitFormData.append('side_image', images.side_image);
    }
    if (images.rear_image) {
      submitFormData.append('rear_image', images.rear_image);
    }

    onSubmit(submitFormData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" encType='multipart/form-data'>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Numéro de véhicule *
          </label>
          <input
            type="text"
            name="vehicle_number"
            value={formData.vehicle_number}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marque *
          </label>
          <input
            type="text"
            name="make"
            value={formData.make}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Modèle *
          </label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Année *
          </label>
          <input
            type="number"
            name="year"
            value={formData.year}
            onChange={handleInputChange}
            required
            min="1900"
            max={new Date().getFullYear() + 1}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            VIN *
          </label>
          <input
            type="text"
            name="vin"
            value={formData.vin}
            onChange={handleInputChange}
            required
            maxLength={17}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Plaque d'immatriculation *
          </label>
          <input
            type="text"
            name="license_plate"
            value={formData.license_plate}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Compagnie *
          </label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de véhicule *
          </label>
          <select
            name="vehicle_type"
            value={formData.vehicle_type}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="STRAIGHT_TRUCK">Camion droit</option>
            <option value="TRACTOR">Tracteur</option>
            <option value="TRAILER">Remorque</option>
            <option value="BUS">Bus</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>
      </div>

      {/* Section des images */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Images du véhicule</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image avant
            </label>
            <input
              type="file"
              ref={frontImageRef}
              accept="image/*"
              onChange={(e) => handleImageChange(e, 'front_image')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {images.front_image && (
              <p className="text-sm text-green-600 mt-1">
                {images.front_image.name}
              </p>
            )}
            {vehicle?.front_image && !images.front_image && (
              <p className="text-sm text-gray-500 mt-1">
                Image actuelle disponible
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image latérale
            </label>
            <input
              type="file"
              ref={sideImageRef}
              accept="image/*"
              onChange={(e) => handleImageChange(e, 'side_image')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {images.side_image && (
              <p className="text-sm text-green-600 mt-1">
                {images.side_image.name}
              </p>
            )}
            {vehicle?.side_image && !images.side_image && (
              <p className="text-sm text-gray-500 mt-1">
                Image actuelle disponible
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image arrière
            </label>
            <input
              type="file"
              ref={rearImageRef}
              accept="image/*"
              onChange={(e) => handleImageChange(e, 'rear_image')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {images.rear_image && (
              <p className="text-sm text-green-600 mt-1">
                {images.rear_image.name}
              </p>
            )}
            {vehicle?.rear_image && !images.rear_image && (
              <p className="text-sm text-gray-500 mt-1">
                Image actuelle disponible
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'En cours...' : vehicle ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
};

export default VehicleForm;