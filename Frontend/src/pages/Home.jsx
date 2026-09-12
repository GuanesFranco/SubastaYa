import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AuctionCard from '../components/AuctionCard';

export default function Home() {
  const [auctions, setAuctions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtros
  const [categoriaId, setCategoriaId] = useState('');
  const [estado, setEstado] = useState('Activa');

  const fetchCategorias = async () => {
    try {
      // Como advirtió Enzo, las categorías vienen planas, NO paginadas
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Error al cargar categorías', err);
    }
  };

  const fetchSubastas = async () => {
    try {
      setLoading(true);
      
      let url = '/auctions?pageSize=20';
      if (categoriaId) url += `&categoriaId=${categoriaId}`;
      if (estado) url += `&estado=${estado}`;

      // Subastas SI vienen paginadas
      const response = await api.get(url);
      setAuctions(response.data.items || []);
    } catch (err) {
      setError(err.message || 'Error al cargar el catálogo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  useEffect(() => {
    fetchSubastas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaId, estado]);

  return (
    <div className="layout-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Catálogo de Subastas</h1>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select 
            className="input-field" 
            style={{ width: 'auto' }}
            value={categoriaId} 
            onChange={(e) => setCategoriaId(e.target.value)}
          >
            <option value="">Todas las Categorías</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
          
          <select 
            className="input-field" 
            style={{ width: 'auto' }}
            value={estado} 
            onChange={(e) => setEstado(e.target.value)}
          >
            {/* Los enums van como strings literales */}
            <option value="">Todos los Estados</option>
            <option value="Activa">Activas</option>
            <option value="Programada">Programadas</option>
            <option value="Finalizada">Finalizadas</option>
            <option value="Desierta">Desiertas</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando catálogo...</div>
      ) : auctions.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No se encontraron subastas con estos filtros.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '2rem' 
        }}>
          {auctions.map(auction => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
}
