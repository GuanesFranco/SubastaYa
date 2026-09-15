import React from 'react';
import './Skeleton.css';

function Bloque({ ancho, alto, radio, className = '' }) {
  return (
    <span
      className={`skeleton__bloque ${className}`.trim()}
      style={{ width: ancho, height: alto, borderRadius: radio }}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="skeleton-card glass-panel">
      <div className="skeleton-card__media">
        <Bloque ancho="72px" alto="22px" radio="var(--radius-full)" className="skeleton-card__estado" />
      </div>
      <div className="skeleton-card__cuerpo">
        <Bloque ancho="30%" alto="12px" />
        <Bloque ancho="85%" alto="20px" />
        <div className="skeleton-card__precio">
          <Bloque ancho="35%" alto="12px" />
          <Bloque ancho="55%" alto="28px" />
        </div>
        <div className="skeleton-card__pie">
          <Bloque ancho="35%" alto="14px" />
          <Bloque ancho="30%" alto="14px" />
        </div>
      </div>
      <div className="skeleton-card__cta">
        <Bloque ancho="34%" alto="14px" />
      </div>
    </div>
  );
}

function SkeletonFila({ columnas }) {
  return (
    <div className="skeleton-fila" style={{ gridTemplateColumns: `repeat(${columnas}, 1fr)` }}>
      {Array.from({ length: columnas }, (_, i) => (
        <Bloque key={i} ancho={i === columnas - 1 ? '50%' : '70%'} alto="14px" />
      ))}
    </div>
  );
}

function SkeletonPanel({ lineas }) {
  return (
    <div className="skeleton-panel glass-panel">
      <Bloque ancho="40%" alto="14px" />
      <Bloque ancho="75%" alto="32px" />
      {Array.from({ length: lineas }, (_, i) => (
        <Bloque key={i} ancho={i % 2 === 0 ? '100%' : '85%'} alto="14px" />
      ))}
    </div>
  );
}

function SkeletonMetrica() {
  return (
    <div className="skeleton-metrica glass-panel">
      <Bloque ancho="50%" alto="14px" />
      <Bloque ancho="70%" alto="36px" />
    </div>
  );
}

export default function Skeleton({ variante = 'texto', cantidad = 1, columnas = 4, lineas = 3, etiqueta = 'Cargando contenido' }) {
  const items = Array.from({ length: cantidad }, (_, i) => i);

  let contenido;
  switch (variante) {
    case 'cards':
      contenido = <div className="skeleton-grid">{items.map((i) => <SkeletonCard key={i} />)}</div>;
      break;
    case 'filas':
      contenido = <div className="skeleton-filas glass-panel">{items.map((i) => <SkeletonFila key={i} columnas={columnas} />)}</div>;
      break;
    case 'panel':
      contenido = <SkeletonPanel lineas={lineas} />;
      break;
    case 'metricas':
      contenido = <div className="skeleton-metricas">{items.map((i) => <SkeletonMetrica key={i} />)}</div>;
      break;
    case 'texto':
    default:
      contenido = (
        <div className="skeleton-texto">
          {items.map((i) => <Bloque key={i} ancho={i === items.length - 1 && items.length > 1 ? '60%' : '100%'} alto="14px" />)}
        </div>
      );
  }

  return (
    <div className="skeleton" role="status" aria-busy="true" aria-label={etiqueta}>
      {contenido}
    </div>
  );
}
