import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menubar } from 'primereact/menubar';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Menu } from 'primereact/menu';

const Navbar: React.FC = () => {
  const menuRef = useRef<Menu>(null);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      command: () => navigate('/dashboard'),
      className: location.pathname === '/dashboard' ? 'p-menuitem-active' : ''
    },
    {
      label: 'Voyages',
      icon: 'pi pi-map',
      command: () => navigate('/trips'),
      className: location.pathname === '/trips' ? 'p-menuitem-active' : ''
    },
    {
      label: 'Véhicules',
      icon: 'pi pi-truck',
      command: () => navigate('/vehicles'),
      className: location.pathname === '/vehicles' ? 'p-menuitem-active' : ''
    },
    {
      label: 'Logs ELD',
      icon: 'pi pi-file-edit',
      command: () => navigate('/eld-logs'),
      className: location.pathname === '/eld-logs' ? 'p-menuitem-active' : ''
    }
  ];

  // Ajouter l'élément utilisateurs pour admin et dispatcher
  if (user?.role === 'admin' || user?.role === 'dispatcher') {
    menuItems.push({
      label: 'Utilisateurs',
      icon: 'pi pi-users',
      command: () => navigate('/users'),
      className: location.pathname === '/users' ? 'p-menuitem-active' : ''
    });
  }

  const userMenuItems = [
    {
      label: user?.first_name + ' ' + user?.last_name,
      icon: 'pi pi-user',
      disabled: true
    },
    {
      separator: true
    },
    {
      label: 'Profil',
      icon: 'pi pi-user-edit',
      command: () => navigate('/profile')
    },
    {
      label: 'Paramètres',
      icon: 'pi pi-cog',
      command: () => navigate('/settings')
    },
    {
      separator: true
    },
    {
      label: 'Déconnexion',
      icon: 'pi pi-sign-out',
      command: handleLogout
    }
  ];

  const start = (
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
        <i className="pi pi-truck" style={{ fontSize: '1.2rem' }}></i>
      </div>
      <div>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1f2937' }}>
          Spotter Transport
        </div>
      </div>
    </div>
  );

  const end = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {/* Notifications */}
      <Button
        icon="pi pi-bell"
        rounded
        text
        severity="secondary"
        style={{ position: 'relative' }}
      >
        <Badge 
          value="3" 
          severity="danger" 
          style={{ 
            position: 'absolute', 
            top: '-8px', 
            right: '-8px',
            minWidth: '18px',
            height: '18px'
          }}
        />
      </Button>

      {/* User Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div className="user-info" style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937' }}>
            {user?.first_name} {user?.last_name}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {user?.role === 'driver' ? 'Conducteur' : 
             user?.role === 'admin' ? 'Administrateur' : 
             user?.role === 'dispatcher' ? 'Répartiteur' : 'Utilisateur'}
          </div>
        </div>
        
        <Menu 
          model={userMenuItems} 
          popup 
          ref={menuRef}
        />
        
        <Avatar
          image="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
          size="normal"
          shape="circle"
          onClick={(e) => menuRef.current?.toggle(e)}
          style={{ cursor: 'pointer', border: '2px solid #e5e7eb' }}
        />
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom: '1rem' }}>
      <Menubar 
        model={menuItems}
        start={start}
        end={end}
        style={{ 
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
        }}
      />
      
      <style>{`
        .p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link {
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin: 0.25rem;
          transition: all 0.2s;
        }
        
        .p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link:hover {
          background: #f3f4f6;
        }
        
        .p-menubar .p-menubar-root-list > .p-menuitem.p-menuitem-active > .p-menuitem-link {
          background: #dbeafe;
          color: #1d4ed8;
        }
        
        .p-menubar {
          border: none;
          padding: 1rem;
        }
        
        @media (max-width: 768px) {
          .user-info {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Navbar;