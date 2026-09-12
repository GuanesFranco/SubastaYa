import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function AuctionCard({ auction }) {
  // Manejo de enums como strings
  const isActive = auction.estado === 'Activa';
  const isScheduled = auction.estado === 'Programada';
  
  // Colores dinámicos
  const statusColor = isActive ? 'var(--success)' : (isScheduled ? 'var(--warning)' : 'var(--text-muted)');
  
  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  });

  const [tiempoRestante, setTiempoRestante] = useState('');

  useEffect(() => {
    if (!auction.fechaFin || auction.estado !== 'Activa') return;
    
    const fechaFinObj = new Date(auction.fechaFin);
    const interval = setInterval(() => {
      const diff = fechaFinObj.getTime() - Date.now();
      if (diff <= 0) {
        setTiempoRestante('Finalizando...');
        return;
      }
      
      const horas = Math.floor(diff / (1000 * 60 * 60));
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTiempoRestante(`${horas}h ${minutos}m ${segundos}s`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [auction.fechaFin, auction.estado]);

  return (
    <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', transition: 'transform 0.2s', cursor: 'pointer' }}
         onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
         onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ height: '200px', width: '100%', backgroundColor: 'rgba(0,0,0,0.5)', backgroundImage: `url(${auction.urlImagen || 'https://loremflickr.com/600/400/auction?lock=' + auction.id})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      </div>
      
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {auction.categoriaNombre || 'General'}
          </span>
          <span style={{ fontSize: '0.8rem', color: statusColor, fontWeight: 'bold', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
            {auction.estado}
          </span>
        </div>
        
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {auction.titulo}
        </h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {auction.cantidadPujas !== undefined ? `${auction.cantidadPujas} oferta(s)` : ''}
            {tiempoRestante && <span style={{ marginLeft: '1rem', color: 'var(--text-main)' }}>⏱ {tiempoRestante}</span>}
          </p>
          {auction.esGanador && (
            <span style={{ fontSize: '0.8rem', background: 'var(--success)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 'bold' }}>
              ¡Ganaste! 🏆
            </span>
          )}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Precio Actual</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isActive ? 'var(--success)' : 'var(--text-main)' }}>
              {formatter.format(auction.precioActual || auction.precioBase)}
            </p>
          </div>
          
          <Link to={`/subasta/${auction.id}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            Ver Detalles
          </Link>
        </div>
      </div>
    </div>
  );
}
