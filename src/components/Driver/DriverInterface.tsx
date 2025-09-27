import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { locationService, driverService } from '../../services/api';
import type { Trip } from '../../types';

const DriverInterface: React.FC = () => {
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [hosData, setHosData] = useState({
    driving_hours: 0,
    duty_hours: 0,
    cycle_hours: 0,
    remaining_driving: 11,
    remaining_duty: 14,
    remaining_cycle: 70
  });
  const toast = useRef<Toast>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const watchId = useRef<number | null>(null);

  const updateVehiclePosition = useCallback(async (pos: { lat: number; lng: number }) => {
    try {
      await locationService.updateVehiclePosition(pos.lat, pos.lng);
    } catch (error) {
      console.error('Erreur mise à jour position:', error);
    }
  }, []);

  const startLocationTracking = useCallback(() => {
    if (navigator.geolocation) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString()
          };
          
          // Mettre à jour la position locale
          setPosition({ lat: location.latitude, lng: location.longitude });
          
          // Envoyer la position au serveur si un voyage est en cours
          if (currentTrip?.id) {
            updateVehiclePosition({ lat: location.latitude, lng: location.longitude });
          }
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible d\'accéder à la géolocalisation',
            life: 3000
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  }, [currentTrip, toast, updateVehiclePosition]);

  const stopLocationTracking = useCallback(() => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  // Géolocalisation en temps réel
  useEffect(() => {
    if (currentTrip?.status === 'in_progress') {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => stopLocationTracking();
  }, [currentTrip?.status, startLocationTracking, stopLocationTracking]);

  const createTrip = async () => {
    if (!origin.trim() || !destination.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Veuillez saisir l\'origine et la destination'
      });
      return;
    }

    try {
      setLoading(true);
      
      // Données simplifiées - driver et vehicle assignés automatiquement côté backend
      const tripData = {
        current_location: origin,
        pickup_location: origin,
        dropoff_location: destination,
        current_cycle_hours: hosData.cycle_hours,
        planned_start_time: new Date().toISOString(),
        // Suppression de status - sera défini par défaut à 'PLANNED' côté backend
      };

      const newTrip = await driverService.createTrip(tripData);
      setCurrentTrip(newTrip);
      
      toast.current?.show({
        severity: 'success',
        summary: 'Succès',
        detail: 'Voyage créé avec succès'
      });
    } catch (error: any) {
      console.error('Erreur création voyage:', error);
      
      // Afficher les erreurs spécifiques du backend
      if (error.response?.data?.vehicle) {
        toast.current?.show({
          severity: 'error',
          summary: 'Erreur véhicule',
          detail: Array.isArray(error.response.data.vehicle) 
            ? error.response.data.vehicle[0] 
            : error.response.data.vehicle
        });
      } else if (error.response?.data?.non_field_errors) {
        toast.current?.show({
          severity: 'error',
          summary: 'Erreur',
          detail: Array.isArray(error.response.data.non_field_errors) 
            ? error.response.data.non_field_errors[0] 
            : error.response.data.non_field_errors
        });
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Erreur',
          detail: error.response?.data?.error || 'Impossible de créer le voyage'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const startTrip = async () => {
    if (!currentTrip) return;

    try {
      setLoading(true);
      await driverService.startTrip(currentTrip.id.toString());
      
      setCurrentTrip({
        ...currentTrip,
        status: 'in_progress',
        start_time: new Date().toISOString()
      });

      // Commencer le calcul HOS
      startHOSTracking();
      
      toast.current?.show({
        severity: 'success',
        summary: 'Voyage démarré',
        detail: 'Bon voyage ! Votre position est maintenant suivie.'
      });
    } catch (error: any) {
      console.error('Erreur démarrage voyage:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Erreur',
        detail: error.response?.data?.error || 'Impossible de démarrer le voyage'
      });
    } finally {
      setLoading(false);
    }
  };

  const startTripTracking = async () => {
    if (!currentTrip) return;

    // Obtenir la position GPS actuelle
    if (!navigator.geolocation) {
      toast.current?.show({
        severity: 'error',
        summary: 'Géolocalisation non supportée',
        detail: 'Votre navigateur ne supporte pas la géolocalisation'
      });
      return;
    }

    try {
      setLoading(true);
      
      // Récupérer la position actuelle
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;

      // Appeler l'API pour démarrer le tracking avec calcul d'itinéraire
      const response = await fetch(`/api/trips/${currentTrip.id}/start-tracking/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          current_latitude: latitude,
          current_longitude: longitude
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du démarrage du tracking');
      }

      // Mettre à jour le voyage local
      setCurrentTrip({
        ...currentTrip,
        status: 'in_progress',
        start_time: new Date().toISOString()
      });

      toast.current?.show({
        severity: 'success',
        summary: 'Tracking démarré',
        detail: 'Itinéraire calculé ! Redirection vers la carte...'
      });

      // Rediriger vers la page de tracking avec l'ID du voyage
      setTimeout(() => {
        navigate('/tracking');
      }, 1500);

    } catch (error: any) {
      console.error('Erreur démarrage tracking:', error);
      
      if (error.code === error.PERMISSION_DENIED) {
        toast.current?.show({
          severity: 'error',
          summary: 'Permission refusée',
          detail: 'Veuillez autoriser l\'accès à votre position GPS'
        });
      } else if (error.code === error.TIMEOUT) {
        toast.current?.show({
          severity: 'error',
          summary: 'Timeout GPS',
          detail: 'Impossible d\'obtenir votre position. Vérifiez votre GPS.'
        });
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Erreur',
          detail: error.message || 'Impossible de démarrer le tracking'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const endTrip = async () => {
    if (!currentTrip) return;

    try {
      setLoading(true);
      await driverService.completeTrip(currentTrip.id.toString());
      
      setCurrentTrip(null);
      setOrigin('');
      setDestination('');
      stopHOSTracking();
      
      toast.current?.show({
        severity: 'success',
        summary: 'Voyage terminé',
        detail: 'Voyage complété avec succès'
      });
    } catch (error: any) {
      console.error('Erreur fin voyage:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Erreur',
        detail: error.response?.data?.error || 'Impossible de terminer le voyage'
      });
    } finally {
      setLoading(false);
    }
  };

  const startHOSTracking = () => {
    // Simulation du calcul HOS en temps réel
    const interval = setInterval(() => {
      setHosData(prev => {
        const newDrivingHours = prev.driving_hours + (1/60); // +1 minute
        const newDutyHours = prev.duty_hours + (1/60);
        const newCycleHours = prev.cycle_hours + (1/60);
        
        return {
          driving_hours: Math.min(newDrivingHours, 11),
          duty_hours: Math.min(newDutyHours, 14),
          cycle_hours: Math.min(newCycleHours, 70),
          remaining_driving: Math.max(11 - newDrivingHours, 0),
          remaining_duty: Math.max(14 - newDutyHours, 0),
          remaining_cycle: Math.max(70 - newCycleHours, 0)
        };
      });
    }, 60000); // Mise à jour chaque minute

    // Stocker l'ID de l'interval pour pouvoir l'arrêter
    (window as any).hosInterval = interval;
  };

  const stopHOSTracking = () => {
    if ((window as any).hosInterval) {
      clearInterval((window as any).hosInterval);
      (window as any).hosInterval = null;
    }
  };

  const getHOSColor = (hours: number, max: number) => {
    const percentage = (hours / max) * 100;
    if (percentage >= 90) return '#ef4444'; // Rouge
    if (percentage >= 70) return '#f59e0b'; // Orange
    return '#10b981'; // Vert
  };

  return (
    <>
      <Toast ref={toast} />
      
      <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
        {/* Header conducteur */}
        <Card style={{ marginBottom: '1rem', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>
                Interface Conducteur
              </h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                Bienvenue {user?.first_name} {user?.last_name}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {new Date().toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>
                {position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : 'Position inconnue'}
              </div>
            </div>
          </div>
        </Card>

        {/* Statut HOS */}
        <Card style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="pi pi-clock" style={{ color: '#3b82f6' }}></i>
            Hours of Service (HOS)
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Conduite</span>
                <span>{hosData.driving_hours.toFixed(1)}h / 11h</span>
              </div>
              <ProgressBar 
                value={(hosData.driving_hours / 11) * 100} 
                style={{ height: '8px' }}
                color={getHOSColor(hosData.driving_hours, 11)}
              />
              <small style={{ color: '#6b7280' }}>
                Reste: {hosData.remaining_driving.toFixed(1)}h
              </small>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Service</span>
                <span>{hosData.duty_hours.toFixed(1)}h / 14h</span>
              </div>
              <ProgressBar 
                value={(hosData.duty_hours / 14) * 100} 
                style={{ height: '8px' }}
                color={getHOSColor(hosData.duty_hours, 14)}
              />
              <small style={{ color: '#6b7280' }}>
                Reste: {hosData.remaining_duty.toFixed(1)}h
              </small>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Cycle</span>
                <span>{hosData.cycle_hours.toFixed(1)}h / 70h</span>
              </div>
              <ProgressBar 
                value={(hosData.cycle_hours / 70) * 100} 
                style={{ height: '8px' }}
                color={getHOSColor(hosData.cycle_hours, 70)}
              />
              <small style={{ color: '#6b7280' }}>
                Reste: {hosData.remaining_cycle.toFixed(1)}h
              </small>
            </div>
          </div>
        </Card>

        {/* Gestion du voyage */}
        <Card>
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="pi pi-map" style={{ color: '#3b82f6' }}></i>
            Voyage en cours
          </h3>

          {!currentTrip ? (
            // Créer un nouveau voyage
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Point de départ
                </label>
                <InputText
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Ex: Dépôt Paris Nord"
                  style={{ width: '100%' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Destination
                </label>
                <InputText
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Ex: Marseille Centre Logistique"
                  style={{ width: '100%' }}
                />
              </div>
              
              <Button
                label="Créer le voyage"
                icon="pi pi-plus"
                onClick={createTrip}
                loading={loading}
                style={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  border: 'none',
                  padding: '1rem'
                }}
              />
            </div>
          ) : (
            // Voyage existant
            <div>
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#f8fafc', 
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0 }}>
                    {currentTrip.origin} → {currentTrip.destination}
                  </h4>
                  <Tag 
                    value={currentTrip.status === 'planned' ? 'Planifié' : currentTrip.status === 'in_progress' ? 'En cours' : 'Terminé'}
                    severity={currentTrip.status === 'planned' ? 'warning' : currentTrip.status === 'in_progress' ? 'info' : 'success'}
                  />
                </div>
                
                {position && currentTrip.status === 'in_progress' && (
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    <i className="pi pi-map-marker" style={{ marginRight: '0.5rem' }}></i>
                    Position actuelle: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                    <br />
                    <i className="pi pi-clock" style={{ marginRight: '0.5rem', marginTop: '0.5rem' }}></i>
                    Démarré: {new Date(currentTrip.start_time).toLocaleString('fr-FR')}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                {currentTrip.status === 'planned' && (
                  <>
                    <Button
                      label="Démarrer le voyage"
                      icon="pi pi-play"
                      onClick={startTrip}
                      loading={loading}
                      style={{ 
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        flex: 1
                      }}
                    />
                    <Button
                      label="Commencer le tracking"
                      icon="pi pi-map"
                      onClick={startTripTracking}
                      loading={loading}
                      style={{ 
                        background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                        border: 'none',
                        flex: 1
                      }}
                    />
                  </>
                )}
                
                {currentTrip.status === 'in_progress' && (
                  <>
                    <Button
                      label="Voir la carte"
                      icon="pi pi-map"
                      onClick={() => window.location.href = `/tracking?trip_id=${currentTrip.id}`}
                      style={{ 
                        background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                        border: 'none',
                        flex: 1
                      }}
                    />
                    <Button
                      label="Terminer le voyage"
                      icon="pi pi-stop"
                      onClick={endTrip}
                      loading={loading}
                      severity="danger"
                      style={{ flex: 1 }}
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default DriverInterface;