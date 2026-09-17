import React from 'react';
import './EstadoVacio.css';

const ICONOS = {
  busqueda: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="21" cy="21" r="12" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M30 30l9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M15 21h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  martillo: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M14 30l12-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="24" y="8" width="14" height="10" rx="2" transform="rotate(45 31 13)" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M8 40h20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 36l4-6 4 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  ),
  billetera: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="6" y="14" width="36" height="24" rx="4" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M6 20h36" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="33" cy="29" r="2.5" fill="currentColor" />
      <path d="M12 14V11a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v3" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.5" />
    </svg>
  ),
  etiqueta: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M8 10h16l16 16-14 14L8 24z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="16" cy="18" r="2.5" fill="currentColor" />
    </svg>
  ),
  historial: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="16" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M24 14v10l7 4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
};

export default function EstadoVacio({ icono = 'busqueda', titulo, descripcion, accion = null, compacto = false }) {
  return (
    <div className={`estado-vacio glass-panel${compacto ? ' estado-vacio--compacto' : ''}`}>
      <div className="estado-vacio__icono">{ICONOS[icono] || ICONOS.busqueda}</div>
      <h3 className="estado-vacio__titulo">{titulo}</h3>
      {descripcion && <p className="estado-vacio__descripcion">{descripcion}</p>}
      {accion && <div className="estado-vacio__accion">{accion}</div>}
    </div>
  );
}
