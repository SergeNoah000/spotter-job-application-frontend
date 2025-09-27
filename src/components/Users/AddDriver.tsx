import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Message } from 'primereact/message';
import { FileUpload } from 'primereact/fileupload';
import { Avatar } from 'primereact/avatar';
import { userService } from '../../services/api';
import toast from 'react-hot-toast';

interface DriverFormData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: Date | null;
  license_number: string;
  license_expiry: Date | null;
  license_class: string;
  avatar: File | null;
}

const AddDriver: React.FC = () => {
  const navigate = useNavigate();
  const fileUploadRef = useRef<FileUpload>(null);
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<DriverFormData>({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: null,
    license_number: '',
    license_expiry: null,
    license_class: 'CDL-A',
    avatar: null
  });

  const licenseClassOptions = [
    { label: 'CDL Classe A', value: 'CDL-A' },
    { label: 'CDL Classe B', value: 'CDL-B' },
    { label: 'CDL Classe C', value: 'CDL-C' }
  ];

  const handleAvatarSelect = (event: any) => {
    const file = event.files[0];
    if (file) {
      setFormData({ ...formData, avatar: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation côté client
    if (formData.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    if (!formData.phone.trim()) {
      toast.error('Le numéro de téléphone est requis');
      return;
    }
    
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error('Le prénom et le nom sont requis');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('L\'email est requis');
      return;
    }

    setLoading(true);

    try {
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('password_confirm', formData.password);
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('user_type', 'DRIVER');
      formDataToSend.append('phone_number', formData.phone); // Correction: utiliser phone_number
      formDataToSend.append('cdl_number', formData.license_number);
      
      if (formData.date_of_birth) {
        formDataToSend.append('date_of_birth', formData.date_of_birth.toISOString().split('T')[0]);
      }
      
      if (formData.avatar) {
        formDataToSend.append('avatar', formData.avatar);
      }

      await userService.createUser(formDataToSend);
      toast.success('Conducteur ajouté avec succès !');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du conducteur:', error);
      if (error.response?.data) {
        const errors = error.response.data;
        Object.keys(errors).forEach(key => {
          if (Array.isArray(errors[key])) {
            toast.error(`${key}: ${errors[key][0]}`);
          } else {
            toast.error(`${key}: ${errors[key]}`);
          }
        });
      } else {
        toast.error('Erreur lors de l\'ajout du conducteur');
      }
    } finally {
      setLoading(false);
    }
  };

  const cardHeader = (
    <div style={{ padding: '1rem 0', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          <i className="pi pi-user-plus" style={{ fontSize: '1.2rem' }}></i>
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            Ajouter un Conducteur
          </h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
            Créer un nouveau compte conducteur
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <Card header={cardHeader}>
        <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Photo du conducteur */}
            <div style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ color: '#374151', marginBottom: '1rem', fontSize: '1.1rem' }}>
                Photo du conducteur
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <Avatar 
                  image={avatarPreview || undefined}
                  icon="pi pi-user" 
                  size="xlarge" 
                  shape="circle"
                  style={{ 
                    width: '80px', 
                    height: '80px',
                    backgroundColor: avatarPreview ? 'transparent' : '#e5e7eb',
                    color: '#6b7280'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <FileUpload
                    ref={fileUploadRef}
                    mode="basic"
                    accept="image/*"
                    maxFileSize={5000000} // 5MB
                    onSelect={handleAvatarSelect}
                    chooseLabel="Choisir une photo"
                    className="p-button-outlined"
                    auto={false}
                  />
                  <small style={{ display: 'block', color: '#6b7280', marginTop: '0.5rem' }}>
                    JPG, PNG ou GIF. Maximum 5MB.
                  </small>
                </div>
              </div>
            </div>

            {/* Informations personnelles */}
            <div style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ color: '#374151', marginBottom: '1rem', fontSize: '1.1rem' }}>
                Informations personnelles
              </h3>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                Prénom *
              </label>
              <InputText
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Prénom du conducteur"
                style={{ width: '100%' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                Nom *
              </label>
              <InputText
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Nom de famille"
                style={{ width: '100%' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                Date de naissance
              </label>
              <Calendar
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.value as Date })}
                placeholder="Sélectionner la date"
                dateFormat="dd/mm/yy"
                maxDate={new Date()}
                showIcon
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                Téléphone *
              </label>
              <InputText
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Ex: +1234567890 ou 0123456789"
                style={{ width: '100%' }}
                required
              />
              <small style={{ color: '#6b7280' }}>
                Format international recommandé (+33123456789)
              </small>
            </div>

            {/* Informations de compte */}
            <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
              <h3 style={{ color: '#374151', marginBottom: '1rem', fontSize: '1.1rem' }}>
                Informations de compte
              </h3>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                Nom d'utilisateur *
              </label>
              <InputText
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Nom d'utilisateur unique"
                style={{ width: '100%' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                Email *
              </label>
              <InputText
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemple.com"
                style={{ width: '100%' }}
                required
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                Mot de passe *
              </label>
              <Password
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mot de passe sécurisé"
                style={{ width: '100%' }}
                feedback
                required
              />
            </div>

            {/* Informations de permis */}
            <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
              <h3 style={{ color: '#374151', marginBottom: '1rem', fontSize: '1.1rem' }}>
                Informations du permis de conduire
              </h3>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                Numéro de permis *
              </label>
              <InputText
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                placeholder="Numéro de permis"
                style={{ width: '100%' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                Classe de permis *
              </label>
              <Dropdown
                value={formData.license_class}
                onChange={(e) => setFormData({ ...formData, license_class: e.value })}
                options={licenseClassOptions}
                placeholder="Sélectionner la classe"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                Date d'expiration du permis *
              </label>
              <Calendar
                value={formData.license_expiry}
                onChange={(e) => setFormData({ ...formData, license_expiry: e.value as Date })}
                placeholder="Date d'expiration"
                dateFormat="dd/mm/yy"
                minDate={new Date()}
                showIcon
                style={{ width: '100%' }}
                required
              />
            </div>
          </div>

          <Message 
            severity="info" 
            text="Le conducteur recevra ses identifiants de connexion par email."
            style={{ marginBottom: '1.5rem' }}
          />

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Button
              type="button"
              label="Annuler"
              icon="pi pi-times"
              severity="secondary"
              onClick={() => navigate('/dashboard')}
              style={{ minWidth: '120px' }}
            />
            <Button
              type="submit"
              label={loading ? "Création..." : "Créer le Conducteur"}
              icon={loading ? "pi pi-spin pi-spinner" : "pi pi-check"}
              loading={loading}
              style={{ 
                minWidth: '180px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                border: 'none'
              }}
            />
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddDriver;