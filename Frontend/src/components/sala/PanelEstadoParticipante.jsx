import React from 'react';
import { formatoARS } from '../../utils/formato';

const ICONOS = {
  vendedor: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h16v4H4zM6 9v10h12V9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 13h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  sinOfertar: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 14l6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="11.5" y="4" width="7" height="5" rx="1.2" transform="rotate(45 15 6.5)" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 20h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  liderando: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 17l2-9 4 4 2-6 2 6 4-4 2 9z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M5 20h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  superado: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4l9 16H3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 10v4M12 17v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  invitado: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
};

function contenido(estado, { montoSugerido, precioActual, activa }) {
  switch (estado) {
    case 'vendedor':
      return {
        titulo: 'Sos el vendedor',
        detalle: activa
          ? 'Esta es tu vista de seguimiento. Las ofertas se actualizan en tiempo real.'
          : 'Esta es tu vista de seguimiento de la publicación.'
      };
    case 'liderando':
      return {
        titulo: 'Vas ganando',
        detalle: `Tu oferta de ${formatoARS(precioActual)} es la más alta por ahora.`
      };
    case 'superado':
      return {
        titulo: 'Te superaron',
        detalle: activa
          ? `Ofertá al menos ${formatoARS(montoSugerido)} para volver a liderar.`
          : 'Otra oferta quedó por encima de la tuya.'
      };
    case 'invitado':
      return {
        titulo: 'Estás viendo como invitado',
        detalle: activa
          ? 'Iniciá sesión para poder ofertar en esta subasta.'
          : 'Iniciá sesión para ver el detalle de tu participación.'
      };
    case 'sinOfertar':
    default:
      return {
        titulo: 'Todavía no ofertaste',
        detalle: activa
          ? `La oferta mínima ahora es ${formatoARS(montoSugerido)}.`
          : 'No participaste en esta subasta.'
      };
  }
}

export default function PanelEstadoParticipante({ estado, montoSugerido, precioActual, activa, alerta = 0 }) {
  const { titulo, detalle } = contenido(estado, { montoSugerido, precioActual, activa });

  return (
    <section className={`panel-estado panel-estado--${estado}`} role="status" aria-live="polite">
      <div key={alerta} className={`panel-estado__contenido${alerta > 0 ? ' panel-estado__contenido--sacudir' : ''}`}>
        <span className="panel-estado__icono">{ICONOS[estado] || ICONOS.sinOfertar}</span>
        <div className="panel-estado__texto">
          <strong className="panel-estado__titulo">{titulo}</strong>
          <span className="panel-estado__detalle">{detalle}</span>
        </div>
      </div>
    </section>
  );
}
