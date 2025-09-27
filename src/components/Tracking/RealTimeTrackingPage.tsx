import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Panel } from 'primereact/panel';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { ProgressBar } from 'primereact/progressbar';
import { useAuth } from '../../contexts/AuthContext';
import { locationService, eldService } from '../../services/api';
import RealTimeMap from '../Map/RealTimeMap';

const RealTimeTrackingPage: React.FC = () => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [hosStatus, setHosStatus] = useState<string>('OFF_DUTY');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
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
  const watchId = useRef<number | null>(null);
  const updateInterval = useRef<NodeJS.Timeout | null>(null);

  // Options de statut HOS selon FMCSA
  const hosStatusOptions = [
    { label: '🔴 Hors service', value: 'OFF_DUTY', description: 'Repos personnel, pas de travail' },
    { label: '🛏️ Couchette', value: 'SLEEPER_BERTH', description: 'Repos dans la couchette du camion' },
    { label: '🚛 Conduite', value: 'DRIVING', description: 'Conduite du véhicule commercial' },
    { label: '🔧 En service (non-conduite)', value: 'ON_DUTY_NOT_DRIVING', description: 'Travail sans conduire (chargement, inspection, etc.)' }
  ];

  // Fonctions de géolocalisation déclarées avec useCallback pour éviter les re-renders
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
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setPosition(newPos);
          
          // Mettre à jour la position sur le serveur
          updateVehiclePosition(newPos);
        },
        (error) => {
          console.error('Erreur géolocalisation:', error);
          toast.current?.show({
            severity: 'warn',
            summary: 'Géolocalisation',
            detail: 'Impossible de récupérer votre position'
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    }
  }, [updateVehiclePosition]);

  const stopLocationTracking = useCallback(() => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const loadVehiclePositions = useCallback(async () => {
    try {
      const response = await locationService.getVehiclePositions();
      setVehicles(response.positions || []);
    } catch (error) {
      console.error('Erreur chargement positions:', error);
    }
  }, []);

  const startVehiclePolling = useCallback(() => {
    // Récupérer les positions des autres véhicules toutes les 30 secondes
    updateInterval.current = setInterval(async () => {
      try {
        const response = await locationService.getVehiclePositions();
        setVehicles(response.positions || []);
      } catch (error) {
        console.error('Erreur récupération positions:', error);
      }
    }, 30000);
    
    // Appel initial
    loadVehiclePositions();
  }, [loadVehiclePositions]);

  const stopVehiclePolling = useCallback(() => {
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
      updateInterval.current = null;
    }
  }, []);

  // Nouvelle fonction pour charger le statut HOS actuel depuis le backend
  const loadCurrentHOSStatus = useCallback(async () => {
    try {
      const response = await eldService.getCurrentHOSStatus();
      
      // Mettre à jour les données HOS avec les vraies données du backend
      if (response.current_status) {
        setHosStatus(response.current_status.duty_status.toUpperCase());
      }
      
      if (response.daily_hours && response.cycle_hours) {
        setHosData({
          driving_hours: response.daily_hours.driving_hours || 0,
          duty_hours: response.daily_hours.on_duty_hours || 0,
          cycle_hours: response.cycle_hours.total_hours || 0,
          remaining_driving: response.daily_hours.remaining_driving || 11,
          remaining_duty: response.daily_hours.remaining_on_duty || 14,
          remaining_cycle: response.cycle_hours.remaining_hours || 70
        });
      }
      
    } catch (error) {
      console.error('Erreur chargement statut HOS:', error);
      // Continuer avec les valeurs par défaut en cas d'erreur
    }
  }, []);

  // Démarrer le suivi GPS au montage
  useEffect(() => {
    startLocationTracking();
    startVehiclePolling();
    
    return () => {
      stopLocationTracking();
      stopVehiclePolling();
    };
  }, [startLocationTracking, startVehiclePolling, stopLocationTracking, stopVehiclePolling]);

  // Charger le statut HOS au démarrage
  useEffect(() => {
    loadCurrentHOSStatus();
  }, [loadCurrentHOSStatus]);

  const handleHOSStatusChange = async (newStatus: string) => {
    try {
      setLoading(true);
      
      // Utiliser le vrai service ELD
      await eldService.createHOSStatusChange({
        duty_status: newStatus.toLowerCase(),
        location: position ? `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}` : 'Position inconnue',
        notes: notes.trim() || undefined
      });
      
      setHosStatus(newStatus);
      setNotes('');
      
      const statusLabel = hosStatusOptions.find(opt => opt.value === newStatus)?.label;
      toast.current?.show({
        severity: 'success',
        summary: 'Statut HOS mis à jour',
        detail: `Nouveau statut: ${statusLabel}`
      });
      
      // Recharger le statut HOS actuel
      loadCurrentHOSStatus();
      
    } catch (error: any) {
      console.error('Erreur changement statut HOS:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Erreur',
        detail: error.response?.data?.error || 'Impossible de changer le statut HOS'
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStatusInfo = () => {
    const current = hosStatusOptions.find(opt => opt.value === hosStatus);
    return current || hosStatusOptions[0];
  };

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'DRIVING': return 'info';
      case 'ON_DUTY_NOT_DRIVING': return 'warning';
      case 'SLEEPER_BERTH': return 'success';
      case 'OFF_DUTY': return 'secondary';
      default: return 'secondary';
    }
  };

  const getHOSColor = (hours: number, maxHours: number) => {
    const percentage = (hours / maxHours) * 100;
    if (percentage >= 90) return '#dc2626'; // Red
    if (percentage >= 75) return '#f97316'; // Orange
    return '#3b82f6'; // Blue
  };

  return (
    <>
      <Toast ref={toast} />
      
      <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <Card style={{ 
          marginBottom: '1rem', 
          background: 'linear-gradient(135deg, #1e40af 0%, #3730a3 100%)', 
          color: 'white' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>
                🗺️ Suivi Temps Réel
              </h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                {user?.first_name} {user?.last_name} - Position et statut HOS
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Tag 
                value={getCurrentStatusInfo().label}
                severity={getStatusSeverity(hosStatus)}
                style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}
              />
              <div style={{ marginTop: '0.5rem', opacity: 0.8, fontSize: '0.9rem' }}>
                {new Date().toLocaleString('fr-FR')}
              </div>
            </div>
          </div>
        </Card>

        {/* Carte interactive */}
        <Card style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="pi pi-map-marker" style={{ color: '#3b82f6' }}></i>
            Position Temps Réel
          </h3>
          
          <RealTimeMap position={position} vehicles={vehicles} />
          
          {position && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '1rem',
              fontSize: '0.9rem'
            }}>
              <div>
                <strong>Latitude:</strong> {position.lat.toFixed(6)}
              </div>
              <div>
                <strong>Longitude:</strong> {position.lng.toFixed(6)}
              </div>
              <div>
                <strong>Dernière MAJ:</strong> {new Date().toLocaleTimeString('fr-FR')}
              </div>
            </div>
          )}
        </Card>

        {/* Panel Actions HOS */}
        <Panel header={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="pi pi-clock" style={{ color: '#3b82f6' }}></i>
            <span>Actions Hours of Service (HOS)</span>
          </div>
        }>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Barres de progression HOS */}
            <Card style={{ backgroundColor: '#f8fafc' }}>
              <h4 style={{ marginTop: 0, color: '#374151', marginBottom: '1rem' }}>
                📊 Status Hours of Service (HOS)
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600' }}>🚛 Conduite</span>
                    <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                      {hosData.driving_hours.toFixed(1)}h / 11h
                    </span>
                  </div>
                  <ProgressBar 
                    value={(hosData.driving_hours / 11) * 100} 
                    style={{ height: '12px', marginBottom: '0.5rem' }}
                    color={getHOSColor(hosData.driving_hours, 11)}
                  />
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    ⏱️ Reste: <strong>{hosData.remaining_driving.toFixed(1)}h</strong>
                  </div>
                </div>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600' }}>🔧 Service</span>
                    <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                      {hosData.duty_hours.toFixed(1)}h / 14h
                    </span>
                  </div>
                  <ProgressBar 
                    value={(hosData.duty_hours / 14) * 100} 
                    style={{ height: '12px', marginBottom: '0.5rem' }}
                    color={getHOSColor(hosData.duty_hours, 14)}
                  />
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    ⏱️ Reste: <strong>{hosData.remaining_duty.toFixed(1)}h</strong>
                  </div>
                </div>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600' }}>📅 Cycle (7j)</span>
                    <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                      {hosData.cycle_hours.toFixed(1)}h / 70h
                    </span>
                  </div>
                  <ProgressBar 
                    value={(hosData.cycle_hours / 70) * 100} 
                    style={{ height: '12px', marginBottom: '0.5rem' }}
                    color={getHOSColor(hosData.cycle_hours, 70)}
                  />
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    ⏱️ Reste: <strong>{hosData.remaining_cycle.toFixed(1)}h</strong>
                  </div>
                </div>
              </div>
              
              {/* Alertes HOS */}
              {(hosData.remaining_driving <= 1 || hosData.remaining_duty <= 1 || hosData.remaining_cycle <= 5) && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  backgroundColor: '#fef2f2', 
                  border: '1px solid #fecaca',
                  borderRadius: '8px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                    <span style={{ fontWeight: '600', color: '#dc2626' }}>Alerte HOS</span>
                  </div>
                  {hosData.remaining_driving <= 1 && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#7f1d1d' }}>
                      • Temps de conduite presque épuisé ({hosData.remaining_driving.toFixed(1)}h restantes)
                    </p>
                  )}
                  {hosData.remaining_duty <= 1 && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#7f1d1d' }}>
                      • Temps de service presque épuisé ({hosData.remaining_duty.toFixed(1)}h restantes)
                    </p>
                  )}
                  {hosData.remaining_cycle <= 5 && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#7f1d1d' }}>
                      • Cycle hebdomadaire bientôt épuisé ({hosData.remaining_cycle.toFixed(1)}h restantes)
                    </p>
                  )}
                </div>
              )}
            </Card>

            {/* Statut actuel */}
            <Card style={{ backgroundColor: '#f8fafc' }}>
              <h4 style={{ marginTop: 0, color: '#374151' }}>Statut Actuel</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <Tag 
                  value={getCurrentStatusInfo().label}
                  severity={getStatusSeverity(hosStatus)}
                  style={{ fontSize: '1.1rem', padding: '0.5rem 1rem' }}
                />
                <span style={{ color: '#6b7280' }}>
                  {getCurrentStatusInfo().description}
                </span>
              </div>
            </Card>

            {/* Changement de statut */}
            <div>
              <h4 style={{ marginBottom: '1rem', color: '#374151' }}>Changer de Statut</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Nouveau Statut HOS
                  </label>
                  <Dropdown
                    value={hosStatus}
                    options={hosStatusOptions}
                    onChange={(e) => setHosStatus(e.value)}
                    placeholder="Sélectionner un statut"
                    style={{ width: '100%' }}
                    itemTemplate={(option) => (
                      <div>
                        <div style={{ fontWeight: '600' }}>{option.label}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{option.description}</div>
                      </div>
                    )}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Notes (optionnel)
                  </label>
                  <InputTextarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Commentaire sur le changement..."
                    rows={3}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              
              <Button
                label="Enregistrer Changement de Statut"
                icon="pi pi-check"
                onClick={() => handleHOSStatusChange(hosStatus)}
                loading={loading}
                style={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  border: 'none',
                  padding: '0.75rem 1.5rem'
                }}
              />
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
};

export default RealTimeTrackingPage;