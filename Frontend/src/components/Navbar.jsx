import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import './Navbar.css';

const claseLink = ({ isActive }) => `navbar__link${isActive ? ' navbar__link--activo' : ''}`;

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const inicial = user && user.nombre ? user.nombre.trim().charAt(0).toUpperCase() : '';

  return (
    <header className="navbar">
      <Link to="/" className="navbar__marca">
        <svg className="navbar__logo" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 14l6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="11.5" y="4" width="7" height="5" rx="1.2" transform="rotate(45 15 6.5)" fill="currentColor" />
          <path d="M4 20h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        SubastaYa
      </Link>

      <nav className={`navbar__links${isAuthenticated ? '' : ' navbar__links--invitado'}`} aria-label="Principal">
        {isAuthenticated ? (
          <>
            <NavLink to="/" end className={claseLink}>Catálogo</NavLink>
            <NavLink to="/mis-actividades" className={claseLink}>Mis actividades</NavLink>
            <NavLink to="/billetera" className={claseLink}>Billetera</NavLink>
            <NavLink to="/publicar" className="btn btn-primary btn-sm navbar__publicar">+ Publicar</NavLink>
          </>
        ) : (
          <div className="navbar__invitado">
            <NavLink to="/publicar" className="btn btn-ghost btn-sm">Publicar</NavLink>
            <Link to="/login" className="navbar__link navbar__crear">Crear cuenta</Link>
            <NavLink to="/login" className="btn btn-primary btn-sm">Iniciar sesión</NavLink>
          </div>
        )}
      </nav>

      {isAuthenticated && (
        <div className="navbar__usuario">
          <span className="navbar__avatar" aria-hidden="true">{inicial}</span>
          <span className="navbar__nombre">{user.nombre}</span>
          <button type="button" className="navbar__salir" onClick={handleLogout}>
            Salir
          </button>
        </div>
      )}
    </header>
  );
}
