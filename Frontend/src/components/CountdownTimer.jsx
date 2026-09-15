import React from 'react';
import useCountdown from '../hooks/useCountdown';
import { formatoDuracion, formatoFechaHora, plural } from '../utils/formato';
import './CountdownTimer.css';

const ETIQUETAS_INACTIVO = {
  Programada: 'Próximamente',
  Finalizada: 'Finalizada',
  Desierta: 'Sin ofertas'
};

const ICONO_RELOJ = (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M10 6v4l2.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function CountdownTimer({ fechaFin, estado, tamano = 'sm', conIcono = true }) {
  const activo = estado === 'Activa';
  const countdown = useCountdown(fechaFin, activo);

  let texto;
  let variante;
  let descripcion;

  if (!activo) {
    texto = ETIQUETAS_INACTIVO[estado] || estado || '';
    variante = 'inactivo';
    descripcion = texto;
  } else if (countdown.terminado) {
    texto = 'Finalizando…';
    variante = 'cerrando';
    descripcion = 'La subasta está finalizando';
  } else if (countdown.lejano) {
    texto = `Cierra ${formatoFechaHora(fechaFin)}`;
    variante = 'lejano';
    descripcion = texto;
  } else {
    texto = formatoDuracion(countdown.ms);
    if (countdown.ultimoMinuto) variante = 'urgente';
    else if (countdown.critico) variante = 'critico';
    else if (countdown.proximo) variante = 'proximo';
    else variante = 'normal';
    const { horas, minutos, segundos } = countdown;
    descripcion = horas > 0
      ? `Quedan ${plural(horas, 'hora', 'horas')} y ${plural(minutos, 'minuto', 'minutos')}`
      : `Quedan ${plural(minutos, 'minuto', 'minutos')} y ${plural(segundos, 'segundo', 'segundos')}`;
  }

  return (
    <span
      className={`countdown countdown--${tamano} countdown--${variante}`}
      role="timer"
      aria-live="off"
      aria-label={descripcion}
    >
      {conIcono && ICONO_RELOJ}
      <span className="countdown__texto">{texto}</span>
    </span>
  );
}
