import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AuctionCard from '../components/AuctionCard';
import Paginador from '../components/Paginador';
import Skeleton from '../components/Skeleton';
import EstadoVacio from '../components/EstadoVacio';
import EstadoError from '../components/EstadoError';
import useRecurso from '../hooks/useRecurso';
import { plural } from '../utils/formato';

const PAGE_SIZE = 12;

const FILTROS_INICIALES = {
  categoriaId: '',
  estado: 'Activa',
  orden: '',
  precioMin: '',
  precioMax: ''
};

export default function Home() {
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [precios, setPrecios] = useState({ min: '', max: '' });

  const categorias = useRecurso(
    (signal) => api.get('/categories', { signal }).then((res) => res.data || []),
    []
  );

  const subastas = useRecurso(async (signal) => {
    const params = { page, pageSize: PAGE_SIZE };
    if (filtros.categoriaId) params.categoriaId = filtros.categoriaId;
    if (filtros.estado) params.estado = filtros.estado;
    if (filtros.precioMin) params.precioMin = filtros.precioMin;
    if (filtros.precioMax) params.precioMax = filtros.precioMax;
    if (filtros.orden) params.orderBy = filtros.orden;

    const res = await api.get('/auctions', { params, signal });
    const paginas = res.data.totalPages || 0;
    if (paginas > 0 && page > paginas) setPage(paginas);
    return res.data;
  }, [page, filtros]);

  const cambiarFiltro = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPage(1);
  };

  const aplicarPrecios = (e) => {
    e.preventDefault();
    setFiltros((prev) => ({ ...prev, precioMin: precios.min, precioMax: precios.max }));
    setPage(1);
  };

  const limpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES);
    setPrecios({ min: '', max: '' });
    setPage(1);
  };

  const hayFiltrosActivos = Object.keys(FILTROS_INICIALES).some((campo) => filtros[campo] !== FILTROS_INICIALES[campo]);

  const items = subastas.datos ? subastas.datos.items || [] : [];
  const totalPages = subastas.datos ? subastas.datos.totalPages || 0 : 0;
  const totalItems = subastas.datos ? subastas.datos.totalItems || 0 : 0;

  const renderResultados = () => {
    if (subastas.cargando) {
      return <Skeleton variante="cards" cantidad={6} etiqueta="Cargando catálogo" />;
    }

    if (subastas.error && !subastas.datos) {
      return <EstadoError error={subastas.error} onReintentar={subastas.recargar} />;
    }

    if (items.length === 0) {
      return (
        <EstadoVacio
          icono="busqueda"
          titulo={hayFiltrosActivos ? 'No hay subastas con estos filtros' : 'Todavía no hay subastas publicadas'}
          descripcion={hayFiltrosActivos
            ? 'Probá con otra categoría, otro estado o un rango de precio más amplio.'
            : 'Cuando alguien publique una subasta va a aparecer acá.'}
          accion={hayFiltrosActivos
            ? <button type="button" className="btn btn-primary" onClick={limpiarFiltros}>Limpiar filtros</button>
            : <Link to="/publicar" className="btn btn-primary">Publicar la primera</Link>}
        />
      );
    }

    return (
      <>
        {subastas.error && (
          <EstadoError compacto error={subastas.error} onReintentar={subastas.recargar} titulo="No pudimos actualizar el catálogo" />
        )}
        <div className="grid-cards" aria-busy={subastas.recargando}>
          {items.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
        <Paginador
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onChange={setPage}
          disabled={subastas.ocupado}
        />
      </>
    );
  };

  return (
    <div className="layout-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Catálogo de Subastas</h1>
        {subastas.datos && items.length > 0 && (
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            {plural(totalItems, 'subasta', 'subastas')}
          </span>
        )}
      </div>

      <div className="glass-panel" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flexGrow: 1 }}>
          <select
            className="input-field"
            style={{ width: 'auto', minWidth: '180px' }}
            value={filtros.categoriaId}
            onChange={(e) => cambiarFiltro('categoriaId', e.target.value)}
            disabled={categorias.cargando}
            aria-label="Categoría"
          >
            <option value="">Todas las categorías</option>
            {(categorias.datos || []).map((cat) => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
          </select>

          <select
            className="input-field"
            style={{ width: 'auto', minWidth: '180px' }}
            value={filtros.estado}
            onChange={(e) => cambiarFiltro('estado', e.target.value)}
            aria-label="Estado"
          >
            <option value="">Todos los estados</option>
            <option value="Activa">Activas</option>
            <option value="Programada">Programadas</option>
            <option value="Finalizada">Finalizadas</option>
            <option value="Desierta">Desiertas</option>
          </select>

          <select
            className="input-field"
            style={{ width: 'auto', minWidth: '200px' }}
            value={filtros.orden}
            onChange={(e) => cambiarFiltro('orden', e.target.value)}
            aria-label="Orden"
          >
            <option value="">Orden por defecto</option>
            <option value="fecha_asc">Próximas a cerrar</option>
            <option value="fecha_desc">Cierre lejano</option>
            <option value="precio_asc">Menor precio</option>
            <option value="precio_desc">Mayor precio</option>
          </select>
        </div>

        <form onSubmit={aplicarPrecios} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginRight: '0.5rem' }}>Precio:</span>
          <input
            type="number"
            placeholder="Mín $"
            className="input-field"
            style={{ width: '100px' }}
            value={precios.min}
            onChange={(e) => setPrecios((prev) => ({ ...prev, min: e.target.value }))}
            min="0"
            aria-label="Precio mínimo"
          />
          <span style={{ color: 'var(--text-muted)' }}>-</span>
          <input
            type="number"
            placeholder="Máx $"
            className="input-field"
            style={{ width: '100px' }}
            value={precios.max}
            onChange={(e) => setPrecios((prev) => ({ ...prev, max: e.target.value }))}
            min="0"
            aria-label="Precio máximo"
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1rem', marginLeft: '0.5rem' }}>Filtrar</button>
          {hayFiltrosActivos && (
            <button type="button" className="btn" onClick={limpiarFiltros} style={{ padding: '0.6rem 1rem', background: 'transparent', color: 'var(--text-muted)' }}>
              Limpiar
            </button>
          )}
        </form>
      </div>

      {renderResultados()}
    </div>
  );
}
