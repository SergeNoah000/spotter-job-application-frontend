import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const user = await login(email, password);
      // Rediriger selon le rôle de l'utilisateur
      if (user?.role === 'driver' || user?.user_type === 'DRIVER') {
        navigate('/driver');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      // Error handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const loginCardHeader = (
    <div style={{ textAlign: 'center', padding: '2rem 0 1rem 0' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        width: '80px',
        height: '80px',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1rem auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <i className="pi pi-truck" style={{ fontSize: '2.5rem', color: 'white' }}></i>
      </div>
      <h1 style={{ 
        fontSize: '2.5rem', 
        fontWeight: 'bold', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: '0 0 0.5rem 0'
      }}>
        Spotter Transport
      </h1>
      <p style={{ color: '#64748b', fontSize: '1.1rem', margin: 0 }}>
        Connectez-vous à votre espace
      </p>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #581c87 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: '-10px',
        left: '-10px',
        width: '160px',
        height: '160px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        animation: 'pulse 3s infinite'
      }}></div>
      <div style={{
        position: 'absolute',
        top: '33%',
        right: '-80px',
        width: '240px',
        height: '240px',
        background: 'rgba(59,130,246,0.1)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        animation: 'pulse 4s infinite'
      }}></div>

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        <Card 
          header={loginCardHeader}
          style={{ 
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            borderRadius: '24px',
            backdropFilter: 'blur(10px)',
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <form onSubmit={handleSubmit} style={{ padding: '0 1rem 1rem 1rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="email" style={{ 
                display: 'block', 
                fontSize: '0.9rem', 
                fontWeight: '600', 
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Adresse e-mail
              </label>
              <div className="p-inputgroup">
                <span className="p-inputgroup-addon">
                  <i className="pi pi-envelope"></i>
                </span>
                <InputText
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  required
                  style={{ fontSize: '1rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="password" style={{ 
                display: 'block', 
                fontSize: '0.9rem', 
                fontWeight: '600', 
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Mot de passe
              </label>
              <div className="p-inputgroup">
                <span className="p-inputgroup-addon">
                  <i className="pi pi-lock"></i>
                </span>
                <InputText
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  type={isPasswordVisible ? "text" : "password"}
                  required
                  style={{ fontSize: '1rem', width: '100%' }}
                />
                <span className="p-inputgroup-addon" style={{ cursor: 'pointer' }} onClick={() => setIsPasswordVisible(!isPasswordVisible)}>
                  <i className={isPasswordVisible ? "pi pi-eye" : "pi pi-eye-slash"}></i> 
                </span>
              </div>
            </div>

            <Button
              type="submit"
              label={isLoading ? "Connexion..." : "Se connecter"}
              icon={isLoading ? "pi pi-spin pi-spinner" : "pi pi-sign-in"}
              loading={isLoading}
              disabled={isLoading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                border: 'none',
                padding: '1rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                borderRadius: '12px',
                marginBottom: '1.5rem'
              }}
            />

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Message 
                severity="info" 
                text="Seuls les administrateurs peuvent créer des comptes conducteurs."
                style={{ marginTop: '1rem' }}
              />
            </div>

            <Message 
              severity="info" 
              text="Compte de démonstration : admin@spotter.com / admin123"
              style={{ marginTop: '1rem' }}
            />
          </form>
        </Card>

        <div style={{ textAlign: 'center', marginTop: '2rem', color: 'rgba(255,255,255,0.7)' }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            © 2025 Spotter Transport. Tous droits réservés.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default Login;