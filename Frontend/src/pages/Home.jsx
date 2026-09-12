import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AuctionCard from '../components/AuctionCard';
import Paginador from '../components/Paginador';

const PAGE_SIZE = 12;

export default function Home() {
  const [auctions, setAuctions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filtros
  const [categoriaId, setCategoriaId] = useState('');
  const [estado, setEstado] = useState('Activa');
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [orden, setOrden] = useState('');
  const [preciosAplicados, setPreciosAplicados] = useState({ min: '', max: '' });

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
      setError('');

      let url = `/auctions?page=${page}&pageSize=${PAGE_SIZE}`;
      if (categoriaId) url += `&categoriaId=${categoriaId}`;
      if (estado) url += `&estado=${estado}`;
      if (preciosAplicados.min) url += `&precioMin=${preciosAplicados.min}`;
      if (preciosAplicados.max) url += `&precioMax=${preciosAplicados.max}`;
      if (orden) url += `&orderBy=${orden}`;

      // Subastas SI vienen paginadas
      const response = await api.get(url);
      const paginas = response.data.totalPages || 0;

      if (paginas > 0 && page > paginas) {
        setPage(paginas);
        return;
      }

      setAuctions(response.data.items || []);
      setTotalPages(paginas);
      setTotalItems(response.data.totalItems || 0);
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
  }, [page, categoriaId, estado, orden, preciosAplicados]);

  const cambiarCategoria = (valor) => {
    setCategoriaId(valor);
    setPage(1);
  };

  const cambiarEstado = (valor) => {
    setEstado(valor);
    setPage(1);
  };

  const cambiarOrden = (valor) => {
    setOrden(valor);
    setPage(1);
  };

  const aplicarFiltrosPrecios = (e) => {
    e.preventDefault();
    setPreciosAplicados({ min: precioMin, max: precioMax });
    setPage(1);
  };

  return (
    <div className="layout-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Catálogo de Subastas</h1>
      </div>

      <div className="glass-panel" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flexGrow: 1 }}>
          <select className="input-field" style={{ width: 'auto', minWidth: '180px' }} value={categoriaId} onChange={(e) => cambiarCategoria(e.target.value)}>
            <option value="">Todas las Categorías</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
          </select>

          <select className="input-field" style={{ width: 'auto', minWidth: '180px' }} value={estado} onChange={(e) => cambiarEstado(e.target.value)}>
            <option value="">Todos los Estados</option>
            <option value="Activa">Activas</option>
            <option value="Programada">Programadas</option>
            <option value="Finalizada">Finalizadas</option>
            <option value="Desierta">Desiertas</option>
          </select>

          <select className="input-field" style={{ width: 'auto', minWidth: '200px' }} value={orden} onChange={(e) => cambiarOrden(e.target.value)}>
            <option value="">Orden (Por Defecto)</option>
            <option value="fecha_asc">Próximas a cerrar</option>
            <option value="fecha_desc">Cierre lejano</option>
            <option value="precio_asc">Menor precio</option>
            <option value="precio_desc">Mayor precio</option>
          </select>
        </div>

        <form onSubmit={aplicarFiltrosPrecios} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginRight: '0.5rem' }}>Precio:</span>
          <input type="number" placeholder="Min $" className="input-field" style={{ width: '100px' }} value={precioMin} onChange={(e) => setPrecioMin(e.target.value)} />
          <span style={{ color: 'var(--text-muted)' }}>-</span>
          <input type="number" placeholder="Max $" className="input-field" style={{ width: '100px' }} value={precioMax} onChange={(e) => setPrecioMax(e.target.value)} />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1rem', marginLeft: '0.5rem' }}>Filtrar</button>
        </form>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando catálogo...</div>
      ) : auctions.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No se encontraron subastas con estos filtros.</p>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {auctions.map(auction => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>

          <Paginador
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onChange={setPage}
            disabled={loading}
          />
        </>
      )}
    </div>
  );
}
