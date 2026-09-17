import React, { useState } from 'react';
import { IMAGENES_SUGERIDAS, imagenesPara } from '../utils/imagenes';
import './SelectorImagen.css';

export default function SelectorImagen({ categoriaId, valor, onElegir, describedBy }) {
  const [verTodas, setVerTodas] = useState(false);

  const filtradas = imagenesPara(categoriaId);
  const mostrarFiltro = Boolean(categoriaId) && filtradas.length < IMAGENES_SUGERIDAS.length;
  const visibles = mostrarFiltro && !verTodas ? filtradas : IMAGENES_SUGERIDAS;

  return (
    <div className="selector-imagen" role="group" aria-label="Imágenes sugeridas" aria-describedby={describedBy}>
      <div className="selector-imagen__grilla">
        {visibles.map((img) => {
          const elegida = valor === img.url;
          return (
            <button
              key={img.id}
              type="button"
              className={`selector-imagen__opcion${elegida ? ' selector-imagen__opcion--elegida' : ''}`}
              onClick={() => onElegir(elegida ? '' : img.url)}
              aria-pressed={elegida}
              title={img.titulo}
            >
              <img src={img.miniatura} alt={img.titulo} loading="lazy" width="150" height="150" />
              <span className="selector-imagen__titulo">{img.titulo}</span>
              {elegida && (
                <span className="selector-imagen__check" aria-hidden="true">
                  <svg viewBox="0 0 20 20">
                    <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {mostrarFiltro && (
        <button type="button" className="selector-imagen__toggle" onClick={() => setVerTodas((v) => !v)}>
          {verTodas ? 'Mostrar solo esta categoría' : `Ver todas (${IMAGENES_SUGERIDAS.length})`}
        </button>
      )}
    </div>
  );
}
