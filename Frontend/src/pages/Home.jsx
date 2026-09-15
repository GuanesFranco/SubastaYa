import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import AuctionCard from '../components/AuctionCard';
import Paginador from '../components/Paginador';
import Skeleton from '../components/Skeleton';
import EstadoVacio from '../components/EstadoVacio';
import EstadoError from '../components/EstadoError';
import useRecurso from '../hooks/useRecurso';
import useTitulo from '../hooks/useTitulo';
import { plural } from '../utils/formato';
import './Home.css';

const PAGE_SIZE = 12;
const ESTADO_POR_DEFECTO = 'Activa';
const ORDEN_POR_DEFECTO = 'fecha_asc';

const ESTADOS = [
  { valor: 'Activa', etiqueta: 'Activas' },
  { valor: 'Programada', etiqueta: 'Próximas' },
  { valor: 'cerradas', etiqueta: 'Cerradas' },
  { valor: 'todos', etiqueta: 'Todas' }
];

const PARAMS = {
  q: 'q',
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
    busqueda: searchParams.get(PARAMS.q) || '',
    categoriaId: searchParams.get(PARAMS.categoria) || '',
    estado: estado === null ? ESTADO_POR_DEFECTO : estado,
    orden: searchParams.get(PARAMS.orden) || ORDEN_POR_DEFECTO,
    precioMin: searchParams.get(PARAMS.min) || '',
    precioMax: searchParams.get(PARAMS.max) || ''
  };
}

function leerPagina(searchParams) {
  const valor = parseInt(searchParams.get(PARAMS.pagina), 10);
  return Number.isNaN(valor) || valor < 1 ? 1 : valor;
}

const ICONO_BUSCAR = (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ICONO_FILTROS = (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="M3 5h14M6 10h8M8 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export default function Home() {
  useTitulo('Catálogo');
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = leerFiltros(searchParams);
  const page = leerPagina(searchParams);

  const claveUrl = `${filtros.busqueda}|${filtros.precioMin}|${filtros.precioMax}`;
  const [borrador, setBorrador] = useState(() => ({
    busqueda: filtros.busqueda, min: filtros.precioMin, max: filtros.precioMax, origen: claveUrl
  }));
  const [errorPrecio, setErrorPrecio] = useState('');
  const [avanzadosAbiertos, setAvanzadosAbiertos] = useState(false);

  if (borrador.origen !== claveUrl) {
    setBorrador({ busqueda: filtros.busqueda, min: filtros.precioMin, max: filtros.precioMax, origen: claveUrl });
    setErrorPrecio('');
  }

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

  const aplicarBusqueda = () => {
    const termino = borrador.busqueda.trim();
    if (termino === filtros.busqueda) return;
    actualizarParams({ [PARAMS.q]: termino });
  };

  const aplicarPrecios = () => {
    const min = borrador.min === '' ? null : Number(borrador.min);
    const max = borrador.max === '' ? null : Number(borrador.max);
    if (min !== null && max !== null && min > max) {
      setErrorPrecio('El precio mínimo no puede ser mayor que el máximo.');
      return;
    }
    setErrorPrecio('');
    if (borrador.min === filtros.precioMin && borrador.max === filtros.precioMax) return;
    actualizarParams({ [PARAMS.min]: borrador.min, [PARAMS.max]: borrador.max });
  };

  const enviarFiltros = (e) => {
    e.preventDefault();
    aplicarBusqueda();
    aplicarPrecios();
  };

  const cambiarBorrador = (campo, valor) => {
    setBorrador((prev) => ({ ...prev, [campo]: valor }));
    if (campo !== 'busqueda') setErrorPrecio('');
  };

  const limpiarFiltros = () => {
    setBorrador({ busqueda: '', min: '', max: '', origen: '||' });
    setErrorPrecio('');
    setSearchParams({});
  };

  const categorias = useRecurso(
    (signal) => api.get('/categories', { signal }).then((res) => res.data || []),
    []
  );

  const subastas = useRecurso(async (signal) => {
    const params = { page, pageSize: PAGE_SIZE };
    if (filtros.busqueda) params.busqueda = filtros.busqueda;
    if (filtros.categoriaId) params.categoriaId = filtros.categoriaId;
    if (filtros.estado === 'cerradas') params.cerradas = true;
    else if (filtros.estado && filtros.estado !== 'todos') params.estado = filtros.estado;
    if (filtros.precioMin) params.precioMin = filtros.precioMin;
    if (filtros.precioMax) params.precioMax = filtros.precioMax;
    if (filtros.orden) params.orderBy = filtros.orden;

    const res = await api.get('/auctions', { params, signal });
    const paginas = res.data.totalPages || 0;
    if (paginas > 0 && page > paginas) cambiarPagina(paginas);
    return res.data;
  }, [page, filtros]);

  const secundariosActivos = [
    filtros.categoriaId,
    filtros.orden !== ORDEN_POR_DEFECTO,
    filtros.precioMin || filtros.precioMax
  ].filter(Boolean).length;

  const hayFiltrosActivos = Boolean(
    filtros.busqueda
    || filtros.estado !== ESTADO_POR_DEFECTO
    || secundariosActivos > 0
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
            ? 'Probá con otra palabra, otra categoría o un rango de precio más amplio.'
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
          singular="subasta"
          pluralPalabra="subastas"
          onChange={cambiarPagina}
          disabled={subastas.ocupado}
        />
      </>
    );
  };

  return (
    <div className="layout-container catalogo">
      <div className="catalogo__encabezado">
        <h1>Catálogo de subastas</h1>
        <span className="catalogo__total">
          {subastas.datos ? plural(totalItems, 'subasta', 'subastas', '') : ''}
        </span>
      </div>

      <form className="filtros" onSubmit={enviarFiltros} role="search" aria-label="Filtrar el catálogo">
        <div className="filtros__principal">
          <label className="buscador">
            <span className="buscador__icono">{ICONO_BUSCAR}</span>
            <input
              type="search"
              className="input-field buscador__campo"
              placeholder="Buscar por título"
              value={borrador.busqueda}
              onChange={(e) => cambiarBorrador('busqueda', e.target.value)}
              onBlur={aplicarBusqueda}
              aria-label="Buscar subastas por título"
              enterKeyHint="search"
            />
          </label>

          <div className="chips" role="group" aria-label="Estado de la subasta">
            {ESTADOS.map((opcion) => {
              const activo = filtros.estado === opcion.valor;
              return (
                <button
                  key={opcion.valor}
                  type="button"
                  className={`chip${activo ? ' chip--activo' : ''}`}
                  aria-pressed={activo}
                  onClick={() => cambiarEstado(opcion.valor)}
                >
                  {opcion.etiqueta}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className={`btn btn-ghost btn-sm filtros__toggle${secundariosActivos > 0 ? ' filtros__toggle--activo' : ''}`}
            onClick={() => setAvanzadosAbiertos((v) => !v)}
            aria-expanded={avanzadosAbiertos}
            aria-controls="filtros-avanzados"
          >
            {ICONO_FILTROS}
            Más filtros
            {secundariosActivos > 0 && <span className="filtros__conteo">{secundariosActivos}</span>}
          </button>
        </div>

        <div id="filtros-avanzados" className="filtros__avanzados" data-abierto={avanzadosAbiertos}>
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
            value={filtros.orden}
            onChange={(e) => actualizarParams({ [PARAMS.orden]: e.target.value === ORDEN_POR_DEFECTO ? '' : e.target.value })}
            aria-label="Orden"
          >
            <option value="fecha_asc">Cierre más próximo</option>
            <option value="fecha_desc">Cierre más lejano</option>
            <option value="precio_asc">Menor precio</option>
            <option value="precio_desc">Mayor precio</option>
          </select>

          <div className="filtros__precio">
            <span className="filtros__etiqueta">Precio</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Mín $"
              className={`input-field${errorPrecio ? ' input-field--error' : ''}`}
              value={borrador.min}
              onChange={(e) => cambiarBorrador('min', e.target.value)}
              onBlur={aplicarPrecios}
              min="0"
              aria-label="Precio mínimo"
              aria-invalid={Boolean(errorPrecio)}
              aria-describedby={errorPrecio ? 'filtros-precio-error' : undefined}
            />
            <span className="filtros__separador" aria-hidden="true">–</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Máx $"
              className={`input-field${errorPrecio ? ' input-field--error' : ''}`}
              value={borrador.max}
              onChange={(e) => cambiarBorrador('max', e.target.value)}
              onBlur={aplicarPrecios}
              min="0"
              aria-label="Precio máximo"
              aria-invalid={Boolean(errorPrecio)}
              aria-describedby={errorPrecio ? 'filtros-precio-error' : undefined}
            />
          </div>

          {hayFiltrosActivos && (
            <button type="button" className="btn btn-ghost btn-sm filtros__limpiar" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          )}

          {errorPrecio && (
            <p id="filtros-precio-error" className="form-error filtros__error" role="alert">{errorPrecio}</p>
          )}
        </div>

        <button type="submit" className="visualmente-oculto">Aplicar filtros</button>
      </form>

      {renderResultados()}
    </div>
  );
}
