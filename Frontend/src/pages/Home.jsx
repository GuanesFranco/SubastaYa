import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import AuctionCard from '../components/AuctionCard';
import Paginador from '../components/Paginador';
import Skeleton from '../components/Skeleton';
import EstadoVacio from '../components/EstadoVacio';
import EstadoError from '../components/EstadoError';
import useRecurso from '../hooks/useRecurso';
import { plural } from '../utils/formato';
import './Home.css';

const PAGE_SIZE = 12;
const ESTADO_POR_DEFECTO = 'Activa';
const TODOS_LOS_ESTADOS = 'todos';

const PARAMS = {
  categoria: 'categoria',
  estado: 'estado',
  orden: 'orden',
  min: 'min',
  max: 'max',
  pagina: 'pagina'
};

function leerFiltros(searchParams) {
  const estado = searchParams.get(PARAMS.estado);
  return {
    categoriaId: searchParams.get(PARAMS.categoria) || '',
    estado: estado === null ? ESTADO_POR_DEFECTO : estado,
    orden: searchParams.get(PARAMS.orden) || '',
    precioMin: searchParams.get(PARAMS.min) || '',
    precioMax: searchParams.get(PARAMS.max) || ''
  };
}

function leerPagina(searchParams) {
  const valor = parseInt(searchParams.get(PARAMS.pagina), 10);
  return Number.isNaN(valor) || valor < 1 ? 1 : valor;
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = leerFiltros(searchParams);
  const page = leerPagina(searchParams);

  const [precios, setPrecios] = useState(() => ({ min: filtros.precioMin, max: filtros.precioMax }));

  const actualizarParams = (cambios, { reiniciarPagina = true } = {}) => {
    setSearchParams((prev) => {
      const siguiente = new URLSearchParams(prev);
      Object.entries(cambios).forEach(([clave, valor]) => {
        if (valor === '' || valor === null || valor === undefined) siguiente.delete(clave);
        else siguiente.set(clave, String(valor));
      });
      if (reiniciarPagina) siguiente.delete(PARAMS.pagina);
      return siguiente;
    });
  };

  const cambiarPagina = (destino) => {
    actualizarParams({ [PARAMS.pagina]: destino === 1 ? '' : destino }, { reiniciarPagina: false });
  };

  const cambiarEstado = (valor) => {
    actualizarParams({ [PARAMS.estado]: valor === ESTADO_POR_DEFECTO ? '' : valor });
  };

  const aplicarPrecios = (e) => {
    e.preventDefault();
    actualizarParams({ [PARAMS.min]: precios.min, [PARAMS.max]: precios.max });
  };

  const limpiarFiltros = () => {
    setPrecios({ min: '', max: '' });
    setSearchParams({});
  };

  const categorias = useRecurso(
    (signal) => api.get('/categories', { signal }).then((res) => res.data || []),
    []
  );

  const subastas = useRecurso(async (signal) => {
    const params = { page, pageSize: PAGE_SIZE };
    if (filtros.categoriaId) params.categoriaId = filtros.categoriaId;
    if (filtros.estado && filtros.estado !== TODOS_LOS_ESTADOS) params.estado = filtros.estado;
    if (filtros.precioMin) params.precioMin = filtros.precioMin;
    if (filtros.precioMax) params.precioMax = filtros.precioMax;
    if (filtros.orden) params.orderBy = filtros.orden;

    const res = await api.get('/auctions', { params, signal });
    const paginas = res.data.totalPages || 0;
    if (paginas > 0 && page > paginas) cambiarPagina(paginas);
    return res.data;
  }, [page, filtros]);

  const hayFiltrosActivos = Boolean(
    filtros.categoriaId
    || filtros.estado !== ESTADO_POR_DEFECTO
    || filtros.orden
    || filtros.precioMin
    || filtros.precioMax
  );

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
          onChange={cambiarPagina}
          disabled={subastas.ocupado}
        />
      </>
    );
  };

  return (
    <div className="layout-container catalogo">
      <div className="catalogo__encabezado">
        <h1>Catálogo de Subastas</h1>
        {subastas.datos && items.length > 0 && (
          <span className="catalogo__total">{plural(totalItems, 'subasta', 'subastas')}</span>
        )}
      </div>

      <div className="glass-panel filtros">
        <div className="filtros__grupo">
          <select
            className="input-field"
            value={filtros.categoriaId}
            onChange={(e) => actualizarParams({ [PARAMS.categoria]: e.target.value })}
            disabled={categorias.cargando}
            aria-label="Categoría"
          >
            <option value="">Todas las categorías</option>
            {(categorias.datos || []).map((cat) => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
          </select>

          <select
            className="input-field"
            value={filtros.estado}
            onChange={(e) => cambiarEstado(e.target.value)}
            aria-label="Estado"
          >
            <option value={TODOS_LOS_ESTADOS}>Todos los estados</option>
            <option value="Activa">Activas</option>
            <option value="Programada">Programadas</option>
            <option value="Finalizada">Finalizadas</option>
            <option value="Desierta">Desiertas</option>
          </select>

          <select
            className="input-field"
            value={filtros.orden}
            onChange={(e) => actualizarParams({ [PARAMS.orden]: e.target.value })}
            aria-label="Orden"
          >
            <option value="">Orden por defecto</option>
            <option value="fecha_asc">Próximas a cerrar</option>
            <option value="fecha_desc">Cierre lejano</option>
            <option value="precio_asc">Menor precio</option>
            <option value="precio_desc">Mayor precio</option>
          </select>
        </div>

        <form onSubmit={aplicarPrecios} className="filtros__precio">
          <span className="filtros__etiqueta">Precio</span>
          <input
            type="number"
            placeholder="Mín $"
            className="input-field"
            value={precios.min}
            onChange={(e) => setPrecios((prev) => ({ ...prev, min: e.target.value }))}
            min="0"
            aria-label="Precio mínimo"
          />
          <span className="filtros__separador" aria-hidden="true">–</span>
          <input
            type="number"
            placeholder="Máx $"
            className="input-field"
            value={precios.max}
            onChange={(e) => setPrecios((prev) => ({ ...prev, max: e.target.value }))}
            min="0"
            aria-label="Precio máximo"
          />
          <button type="submit" className="btn btn-primary btn-sm">Filtrar</button>
          {hayFiltrosActivos && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={limpiarFiltros}>
              Limpiar
            </button>
          )}
        </form>
      </div>

      {renderResultados()}
    </div>
  );
}
