import React, { useState, useEffect } from 'react';
import { VehicleFormData, Vehicle } from '../../types';
import { Car, Plus, Edit, Upload, X } from 'lucide-react';

interface VehicleFormProps {
  vehicle?: Vehicle;
  onSubmit: (data: VehicleFormData | FormData) => Promise<void>;
  onCancel: () => void;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ vehicle, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<VehicleFormData>({
    vehicle_number: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    license_plate: '',
    company: 1, // Sera défini côté backend
    vehicle_type: 'STRAIGHT_TRUCK',
  });

  const [imageFiles, setImageFiles] = useState<{
    front_image?: File;
    side_image?: File;
    rear_image?: File;
  }>({});

  const [imagePreviews, setImagePreviews] = useState<{
    front_image?: string;
    side_image?: string;
    rear_image?: string;
  }>({});

  useEffect(() => {
    if (vehicle) {
      setFormData({
        vehicle_number: vehicle.vehicle_number,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin,
        license_plate: vehicle.license_plate,
        company: vehicle.company,
        vehicle_type: vehicle.vehicle_type || 'STRAIGHT_TRUCK',
      });

      // Set existing image previews if editing
      if (vehicle.front_image) {
        setImagePreviews(prev => ({ ...prev, front_image: vehicle.front_image }));
      }
      if (vehicle.side_image) {
        setImagePreviews(prev => ({ ...prev, side_image: vehicle.side_image }));
      }
      if (vehicle.rear_image) {
        setImagePreviews(prev => ({ ...prev, rear_image: vehicle.rear_image }));
      }
    }
  }, [vehicle]);

  const handleImageChange = (imageType: 'front_image' | 'side_image' | 'rear_image') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFiles(prev => ({ ...prev, [imageType]: file }));
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreviews(prev => ({ ...prev, [imageType]: previewUrl }));
    }
  };

  const removeImage = (imageType: 'front_image' | 'side_image' | 'rear_image') => {
    setImageFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[imageType];
      return newFiles;
    });
    
    setImagePreviews(prev => {
      const newPreviews = { ...prev };
      if (newPreviews[imageType] && newPreviews[imageType]?.startsWith('blob:')) {
        URL.revokeObjectURL(newPreviews[imageType]!);
      }
      delete newPreviews[imageType];
      return newPreviews;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create FormData for multipart/form-data submission
      const submitData = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          submitData.append(key, value.toString());
        }
      });

      // Add image files if they exist
      if (imageFiles.front_image) {
        submitData.append('front_image', imageFiles.front_image);
      }
      if (imageFiles.side_image) {
        submitData.append('side_image', imageFiles.side_image);
      }
      if (imageFiles.rear_image) {
        submitData.append('rear_image', imageFiles.rear_image);
      }

      await onSubmit(submitData);
      
      if (!vehicle) {
        // Reset form for new vehicle
        setFormData({
          vehicle_number: '',
          make: '',
          model: '',
          year: new Date().getFullYear(),
          vin: '',
          license_plate: '',
          company: 1,
          vehicle_type: 'STRAIGHT_TRUCK',
        });
        setImageFiles({});
        setImagePreviews({});
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setLoading(false);
    }
  };

  const vehicleTypes = [
    { value: 'STRAIGHT_TRUCK', label: 'Camion rigide' },
    { value: 'TRACTOR', label: 'Tracteur' },
    { value: 'TRAILER', label: 'Remorque' },
    { value: 'BUS', label: 'Bus' },
    { value: 'VAN', label: 'Fourgon' },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center mb-6">
        <Car className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">
          {vehicle ? 'Modifier le Véhicule' : 'Nouveau Véhicule'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro du véhicule *
            </label>
            <input
              type="text"
              value={formData.vehicle_number}
              onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
              placeholder="Ex: TRK001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de véhicule *
            </label>
            <select
              value={formData.vehicle_type}
              onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {vehicleTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marque *
            </label>
            <input
              type="text"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              placeholder="Ex: Freightliner"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modèle *
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="Ex: Cascadia"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année *
            </label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              min="1990"
              max={new Date().getFullYear() + 1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VIN *
            </label>
            <input
              type="text"
              value={formData.vin}
              onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
              placeholder="Numéro d'identification du véhicule"
              maxLength={17}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plaque d'immatriculation *
            </label>
            <input
              type="text"
              value={formData.license_plate}
              onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
              placeholder="Ex: ABC123"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Section Images */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Photos du véhicule</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Front Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo avant
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange('front_image')}
                  className="hidden"
                  id="front_image"
                />
                <label
                  htmlFor="front_image"
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                >
                  {imagePreviews.front_image ? (
                    <div className="relative w-full h-full">
                      <img
                        src={imagePreviews.front_image}
                        alt="Aperçu avant"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          removeImage('front_image');
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-500">Ajouter photo</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Side Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo côté
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange('side_image')}
                  className="hidden"
                  id="side_image"
                />
                <label
                  htmlFor="side_image"
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                >
                  {imagePreviews.side_image ? (
                    <div className="relative w-full h-full">
                      <img
                        src={imagePreviews.side_image}
                        alt="Aperçu côté"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          removeImage('side_image');
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-500">Ajouter photo</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Rear Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo arrière
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange('rear_image')}
                  className="hidden"
                  id="rear_image"
                />
                <label
                  htmlFor="rear_image"
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                >
                  {imagePreviews.rear_image ? (
                    <div className="relative w-full h-full">
                      <img
                        src={imagePreviews.rear_image}
                        alt="Aperçu arrière"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          removeImage('rear_image');
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-500">Ajouter photo</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : vehicle ? (
              <Edit className="h-4 w-4 mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Sauvegarde...' : vehicle ? 'Modifier le Véhicule' : 'Ajouter le Véhicule'}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleForm;