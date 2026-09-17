import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useSaldo from '../hooks/useSaldo';
import useTema from '../hooks/useTema';
import Confirmacion from './Confirmacion';
import { formatoARS } from '../utils/formato';
import './Navbar.css';

const claseLink = ({ isActive }) => `navbar__link${isActive ? ' navbar__link--activo' : ''}`;

const ICONO_BILLETERA = (
  <svg className="navbar__saldo-icono" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6H17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <rect x="4" y="7.5" width="16" height="10.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="16.25" cy="12.75" r="1.25" fill="currentColor" />
  </svg>
);

const ICONO_SOL = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const ICONO_LUNA = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const saldo = useSaldo();
  const { tema, esOscuro, alternar } = useTema();
  const navigate = useNavigate();
  const [confirmandoSalida, setConfirmandoSalida] = useState(false);

  const disponible = saldo.datos ? saldo.datos.saldoDisponible : null;

  const handleLogout = () => {
    setConfirmandoSalida(false);
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

      <button
        type="button"
        className="navbar__tema"
        onClick={alternar}
        aria-label={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={esOscuro ? 'Modo claro' : 'Modo oscuro'}
      >
        <span key={tema} className="navbar__tema-icono">
          {esOscuro ? ICONO_SOL : ICONO_LUNA}
        </span>
      </button>

      {isAuthenticated && (
        <div className="navbar__usuario">
          <Link
            to="/billetera"
            className="navbar__saldo"
            aria-label={disponible == null
              ? 'Ir a mi billetera'
              : `Disponible para ofertar: ${formatoARS(disponible)}. Ir a mi billetera`}
          >
            {ICONO_BILLETERA}
            <span key={disponible} className="navbar__saldo-monto">
              {disponible == null ? '—' : formatoARS(disponible)}
            </span>
          </Link>
          <span className="navbar__avatar" aria-hidden="true">{inicial}</span>
          <span className="navbar__nombre">{user.nombre}</span>
          <button
            type="button"
            className="navbar__salir"
            onClick={() => setConfirmandoSalida(true)}
            aria-haspopup="dialog"
          >
            Salir
          </button>
        </div>
      )}

      <Confirmacion
        abierto={confirmandoSalida}
        titulo="¿Cerrás tu sesión?"
        mensaje="Vas a volver a la pantalla de ingreso. Tus ofertas y tu saldo quedan como están."
        textoConfirmar="Sí, salir"
        textoCancelar="Seguir acá"
        peligro
        onConfirmar={handleLogout}
        onCancelar={() => setConfirmandoSalida(false)}
      />
    </header>
  );
}
