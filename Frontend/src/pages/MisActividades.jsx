import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AuctionCard from '../components/AuctionCard';

export default function MisActividades() {
  const [activeTab, setActiveTab] = useState('pujas'); // 'pujas' o 'publicaciones'
  
  const [misPujas, setMisPujas] = useState([]);
  const [misPublicaciones, setMisPublicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMisActividades = async () => {
    try {
      setLoading(true);
      setError('');
      // Ambas devuelven paginado según Enzo
      const [resPujas, resPublicaciones] = await Promise.all([
        api.get('/users/me/bids?pageSize=50'),
        api.get('/users/me/auctions?pageSize=50')
      ]);
      
      setMisPujas(resPujas.data.items || []);
      setMisPublicaciones(resPublicaciones.data.items || []);
    } catch (err) {
      setError('Error al cargar tus actividades: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMisActividades();
  }, []);

  const renderTabButton = (id, label) => (
    <button
      className="btn"
      style={{
        flex: 1,
        background: activeTab === id ? 'var(--glass-bg)' : 'transparent',
        borderBottom: activeTab === id ? '2px solid var(--accent-primary)' : '2px solid transparent',
        color: activeTab === id ? 'var(--text-main)' : 'var(--text-muted)',
        borderRadius: 'var(--radius-md) var(--radius-md) 0 0'
      }}
      onClick={() => setActiveTab(id)}
    >
      {label}
    </button>
  );

  return (
    <div className="layout-container">
      <h1 style={{ marginBottom: '2rem' }}>Mis Actividades</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <div style={{ display: 'flex', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
        {renderTabButton('pujas', 'Subastas donde participé')}
        {renderTabButton('publicaciones', 'Mis Publicaciones')}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando datos...</div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '2rem' 
        }}>
          {activeTab === 'pujas' && (
            misPujas.length === 0 ? (
              <p style={{ gridColumn: '1 / -1', color: 'var(--text-muted)' }}>No has participado en ninguna subasta todavía.</p>
            ) : (
              // MisPujasDto devuelve un resumen, lo mapeamos al formato de AuctionCard
              misPujas.map(puja => (
                <AuctionCard key={`puja-${puja.subastaId}`} auction={{
                  id: puja.subastaId,
                  titulo: puja.titulo,
                  estado: puja.estado,
                  precioActual: puja.precioActual,
                  urlImagen: puja.urlImagen,
                  esGanador: puja.esGanador,
                  fechaFin: puja.fechaFin
                }} />
              ))
            )
          )}

          {activeTab === 'publicaciones' && (
            misPublicaciones.length === 0 ? (
              <p style={{ gridColumn: '1 / -1', color: 'var(--text-muted)' }}>No has publicado ninguna subasta todavía.</p>
            ) : (
              // SubastaResumenDto ya tiene el formato directo para AuctionCard
              misPublicaciones.map(subasta => (
                <AuctionCard key={`pub-${subasta.id}`} auction={subasta} />
              ))
            )
          )}
        </div>
      )}
    </div>
  );
}
