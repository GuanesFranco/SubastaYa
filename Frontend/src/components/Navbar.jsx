import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--accent-primary)' }}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>SubastaYa</Link>
      </div>
      
      <div className="nav-links">
        {isAuthenticated ? (
          <>
            <Link to="/" className="nav-link">Catálogo</Link>
            <Link to="/publicar" className="nav-link" style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>+ Publicar</Link>
            <Link to="/mis-actividades" className="nav-link">Mis Actividades</Link>
            <Link to="/billetera" className="nav-link">Billetera</Link>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--glass-border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Hola, {user.nombre}</span>
              <button onClick={handleLogout} className="btn" style={{ background: 'transparent', color: 'var(--danger)', padding: '0.25rem 0.5rem' }}>
                Salir
              </button>
            </div>
          </>
        ) : (
          <Link to="/login" className="nav-link">Iniciar Sesión</Link>
        )}
      </div>
    </nav>
  );
}
