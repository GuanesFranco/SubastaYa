import React from 'react';
import { plural } from '../utils/formato';
import './Paginador.css';

export default function Paginador({
  page,
  totalPages,
  totalItems,
  onChange,
  disabled = false,
  singular = 'resultado',
  pluralPalabra = 'resultados'
}) {
  if (!totalPages || totalPages <= 1) return null;

  const hayAnterior = page > 1 && !disabled;
  const haySiguiente = page < totalPages && !disabled;

  const irA = (destino) => {
    const objetivo = Math.min(Math.max(destino, 1), totalPages);
    if (objetivo !== page) onChange(objetivo);
  };

  return (
    <nav className="paginador" aria-label="Paginación" aria-busy={disabled}>
      <button
        type="button"
        className="paginador__boton"
        disabled={!hayAnterior}
        onClick={() => irA(page - 1)}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M12 5l-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Anterior
      </button>

      <span className="paginador__info">
        Página <strong>{page}</strong> de {totalPages}
        {typeof totalItems === 'number' && (
          <span className="paginador__total"> · {plural(totalItems, singular, pluralPalabra)}</span>
        )}
      </span>

      <button
        type="button"
        className="paginador__boton"
        disabled={!haySiguiente}
        onClick={() => irA(page + 1)}
      >
        Siguiente
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M8 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </nav>
  );
}
