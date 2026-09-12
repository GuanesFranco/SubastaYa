import React from 'react';

export default function Paginador({ page, totalPages, totalItems, onChange, disabled = false }) {
  if (!totalPages || totalPages <= 1) return null;

  const hayAnterior = page > 1 && !disabled;
  const haySiguiente = page < totalPages && !disabled;

  const irA = (destino) => {
    const objetivo = Math.min(Math.max(destino, 1), totalPages);
    if (objetivo !== page) onChange(objetivo);
  };

  const estiloBoton = (habilitado) => ({
    padding: '0.5rem 1.2rem',
    background: habilitado ? 'var(--glass-bg)' : 'transparent',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    color: habilitado ? 'var(--text-main)' : 'var(--text-muted)',
    cursor: habilitado ? 'pointer' : 'not-allowed',
    opacity: habilitado ? 1 : 0.4
  });

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      gap: '1rem', marginTop: '2rem', flexWrap: 'wrap'
    }}>
      <button
        type="button"
        className="btn"
        style={estiloBoton(hayAnterior)}
        disabled={!hayAnterior}
        onClick={() => irA(page - 1)}
      >
        ← Anterior
      </button>

      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Página <strong style={{ color: 'var(--text-main)' }}>{page}</strong> de {totalPages}
        {typeof totalItems === 'number' && ` · ${totalItems} resultado${totalItems === 1 ? '' : 's'}`}
      </span>

      <button
        type="button"
        className="btn"
        style={estiloBoton(haySiguiente)}
        disabled={!haySiguiente}
        onClick={() => irA(page + 1)}
      >
        Siguiente →
      </button>
    </div>
  );
}
