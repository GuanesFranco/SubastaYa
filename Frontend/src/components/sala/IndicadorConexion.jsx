import React from 'react';
import { ESTADOS_CONEXION } from '../../hooks/useAuctionHub';

const TEXTOS = {
  [ESTADOS_CONEXION.CONECTANDO]: 'Conectando…',
  [ESTADOS_CONEXION.CONECTADO]: 'En vivo',
  [ESTADOS_CONEXION.RECONECTANDO]: 'Reconectando…',
  [ESTADOS_CONEXION.DESCONECTADO]: 'Sin conexión'
};

const DESCRIPCIONES = {
  [ESTADOS_CONEXION.CONECTANDO]: 'Conectando con la sala en vivo',
  [ESTADOS_CONEXION.CONECTADO]: 'Conectado a la sala en vivo, las ofertas se actualizan solas',
  [ESTADOS_CONEXION.RECONECTANDO]: 'Se perdió la conexión, reintentando',
  [ESTADOS_CONEXION.DESCONECTADO]: 'Sin conexión con la sala, los datos pueden estar desactualizados'
};

export default function IndicadorConexion({ estado, onReconectar }) {
  return (
    <span className={`conexion conexion--${estado}`} role="status" aria-label={DESCRIPCIONES[estado]}>
      <span className="conexion__punto" aria-hidden="true" />
      <span className="conexion__texto">{TEXTOS[estado]}</span>
      {estado === ESTADOS_CONEXION.DESCONECTADO && onReconectar && (
        <button type="button" className="conexion__reintentar" onClick={onReconectar}>
          Reconectar
        </button>
      )}
    </span>
  );
}
