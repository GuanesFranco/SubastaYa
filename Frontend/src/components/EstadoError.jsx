import React from 'react';
import { mensajeDeError, TIPOS_ERROR } from '../utils/errores';
import './EstadoError.css';

const TITULOS = {
  [TIPOS_ERROR.RED]: 'Sin conexión con el servidor',
  [TIPOS_ERROR.SERVIDOR]: 'Algo salió mal',
  [TIPOS_ERROR.NO_ENCONTRADO]: 'No encontramos esto',
  [TIPOS_ERROR.DESCONOCIDO]: 'Algo salió mal'
};

export default function EstadoError({ error, titulo, onReintentar = null, accion = null, compacto = false }) {
  const encabezado = titulo || TITULOS[error && error.kind] || TITULOS[TIPOS_ERROR.DESCONOCIDO];
  const detalle = mensajeDeError(error);

  return (
    <div className={`estado-error glass-panel${compacto ? ' estado-error--compacto' : ''}`} role="alert">
      <div className="estado-error__icono">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M24 6l19 34H5z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M24 18v10M24 33.5v.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      </div>
      <div className="estado-error__texto">
        <h3 className="estado-error__titulo">{encabezado}</h3>
        {detalle && <p className="estado-error__detalle">{detalle}</p>}
      </div>
      {(onReintentar || accion) && (
        <div className="estado-error__acciones">
          {onReintentar && (
            <button type="button" className="btn btn-primary" onClick={onReintentar}>
              Reintentar
            </button>
          )}
          {accion}
        </div>
      )}
    </div>
  );
}
