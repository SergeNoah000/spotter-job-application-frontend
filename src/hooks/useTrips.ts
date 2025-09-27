import { useState, useEffect } from 'react';
import { tripService } from '../services/api';
import type { Trip, TripFormData } from '../types';
import toast from 'react-hot-toast';

const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const data = await tripService.getTrips();
      setTrips(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors du chargement des voyages');
    } finally {
      setLoading(false);
    }
  };

  const createTrip = async (tripData: TripFormData) => {
    try {
      // Convertir TripFormData vers le format attendu par l'API
      const tripPayload = {
        ...tripData,
        status: 'planned' as const,
        driver: 1, // Sera défini côté backend selon l'utilisateur connecté
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const newTrip = await tripService.createTrip(tripPayload);
      setTrips(prev => [...prev, newTrip]);
      toast.success('Voyage créé avec succès');
      return newTrip;
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors de la création du voyage');
      throw err;
    }
  };

  const updateTrip = async (id: number, tripData: Partial<Trip>) => {
    try {
      const updatedTrip = await tripService.updateTrip(id, tripData);
      setTrips(prev => prev.map(trip => 
        trip.id === id ? updatedTrip : trip
      ));
      toast.success('Voyage modifié avec succès');
      return updatedTrip;
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors de la modification du voyage');
      throw err;
    }
  };

  const deleteTrip = async (id: number) => {
    try {
      await tripService.deleteTrip(id);
      setTrips(prev => prev.filter(trip => trip.id !== id));
      toast.success('Voyage supprimé avec succès');
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors de la suppression du voyage');
      throw err;
    }
  };

  const startTrip = async (id: number) => {
    try {
      const updatedTrip = await tripService.startTrip(id);
      setTrips(prev => prev.map(trip => 
        trip.id === id ? updatedTrip : trip
      ));
      toast.success('Voyage démarré avec succès');
      return updatedTrip;
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors du démarrage du voyage');
      throw err;
    }
  };

  const endTrip = async (id: number) => {
    try {
      const updatedTrip = await tripService.endTrip(id);
      setTrips(prev => prev.map(trip => 
        trip.id === id ? updatedTrip : trip
      ));
      toast.success('Voyage terminé avec succès');
      return updatedTrip;
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors de la fin du voyage');
      throw err;
    }
  };

  const completeTrip = async (id: number) => {
    try {
      const updatedTrip = await tripService.completeTrip(id);
      setTrips(prev => prev.map(trip => 
        trip.id === id ? updatedTrip : trip
      ));
      toast.success('Voyage complété avec succès');
      return updatedTrip;
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors de la complétion du voyage');
      throw err;
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  return {
    trips,
    loading,
    error,
    fetchTrips,
    createTrip,
    updateTrip,
    deleteTrip,
    startTrip,
    endTrip,
    completeTrip
  };
};

export default useTrips;