import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AuctionCard from '../components/AuctionCard';
import Paginador from '../components/Paginador';
import Skeleton from '../components/Skeleton';
import EstadoVacio from '../components/EstadoVacio';
import EstadoError from '../components/EstadoError';
import useRecurso from '../hooks/useRecurso';
import { formatoARS } from '../utils/formato';

const PAGE_SIZE = 12;
const TOPE_METRICAS = 100;

const TABS = {
  pujas: { recurso: '/users/me/bids', label: 'Subastas donde participé' },
  publicaciones: { recurso: '/users/me/auctions', label: 'Mis publicaciones' }
};

function mapearPujaACard(puja) {
  return {
    id: puja.subastaId,
    titulo: puja.titulo,
    estado: puja.estado,
    precioActual: puja.precioActual,
    urlImagen: puja.urlImagen,
    esGanador: puja.esGanador,
    fechaFin: puja.fechaFin
  };
}

export default function MisActividades() {
  const [activeTab, setActiveTab] = useState('pujas');
  const [paginas, setPaginas] = useState({ pujas: 1, publicaciones: 1 });

  const pageActual = paginas[activeTab];

  const actividades = useRecurso(async (signal) => {
    const res = await api.get(TABS[activeTab].recurso, { params: { page: pageActual, pageSize: PAGE_SIZE }, signal });
    const totalPages = res.data.totalPages || 0;
    if (totalPages > 0 && pageActual > totalPages) {
      setPaginas((prev) => ({ ...prev, [activeTab]: totalPages }));
    }
    return res.data;
  }, [activeTab, pageActual], { grupo: activeTab });

  const metricas = useRecurso(async (signal) => {
    const res = await api.get('/users/me/auctions', { params: { page: 1, pageSize: TOPE_METRICAS }, signal });
    const items = res.data.items || [];
    const total = res.data.totalItems ?? items.length;
    const vendidas = items.filter((s) => s.estado === 'Finalizada' && s.montoFinal != null);

    return {
      totalPublicadas: total,
      vendidas: vendidas.length,
      recaudado: vendidas.reduce((acc, s) => acc + Number(s.montoFinal), 0),
      enCurso: items.filter((s) => s.estado === 'Activa' || s.estado === 'Programada').length,
      parcial: total > items.length
    };
  }, []);

  const cambiarPagina = (destino) => {
    setPaginas((prev) => ({ ...prev, [activeTab]: destino }));
  };

  const items = actividades.datos ? actividades.datos.items || [] : [];
  const totalPages = actividades.datos ? actividades.datos.totalPages || 0 : 0;
  const totalItems = actividades.datos ? actividades.datos.totalItems || 0 : 0;

  const renderTabButton = (id) => (
    <button
      key={id}
      type="button"
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
      {TABS[id].label}
    </button>
  );

  const renderMetrica = (etiqueta, valor, color) => (
    <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>{etiqueta}</p>
      <h2 className="tabular" style={{ fontSize: '2rem', margin: 0, color: color || 'var(--text-main)' }}>{valor}</h2>
    </div>
  );

  const renderMetricas = () => {
    if (metricas.cargando) {
      return <div style={{ marginBottom: '2.5rem' }}><Skeleton variante="metricas" cantidad={4} etiqueta="Cargando métricas" /></div>;
    }
    if (!metricas.datos) return null;

    return (
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {renderMetrica('Recaudado', formatoARS(metricas.datos.recaudado), 'var(--success)')}
          {renderMetrica('Vendidas', metricas.datos.vendidas, 'var(--accent-primary)')}
          {renderMetrica('En curso', metricas.datos.enCurso, 'var(--warning)')}
          {renderMetrica('Publicadas', metricas.datos.totalPublicadas)}
        </div>
        {metricas.datos.parcial && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.75rem', textAlign: 'center' }}>
            La recaudación se calcula sobre tus primeras {TOPE_METRICAS} publicaciones.
          </p>
        )}
      </div>
    );
  };

  const renderVacio = () => {
    if (activeTab === 'pujas') {
      return (
        <EstadoVacio
          icono="martillo"
          titulo="Todavía no participaste en ninguna subasta"
          descripcion="Cuando hagas tu primera oferta, la subasta va a aparecer acá con tu estado en tiempo real."
          accion={<Link to="/" className="btn btn-primary">Explorar el catálogo</Link>}
        />
      );
    }
    return (
      <EstadoVacio
        icono="etiqueta"
        titulo="Todavía no publicaste nada"
        descripcion="Publicá tu primera subasta y seguí desde acá cuánto recaudás."
        accion={<Link to="/publicar" className="btn btn-primary">Publicar una subasta</Link>}
      />
    );
  };

  const renderContenido = () => {
    if (actividades.cargando) {
      return <Skeleton variante="cards" cantidad={6} etiqueta="Cargando tus actividades" />;
    }

    if (actividades.error && !actividades.datos) {
      return <EstadoError error={actividades.error} onReintentar={actividades.recargar} titulo="No pudimos cargar tus actividades" />;
    }

    if (items.length === 0) return renderVacio();

    return (
      <>
        {actividades.error && (
          <EstadoError compacto error={actividades.error} onReintentar={actividades.recargar} titulo="No pudimos actualizar la lista" />
        )}
        <div className="grid-cards" aria-busy={actividades.recargando}>
          {activeTab === 'pujas'
            ? items.map((puja) => <AuctionCard key={`puja-${puja.subastaId}`} auction={mapearPujaACard(puja)} />)
            : items.map((subasta) => <AuctionCard key={`pub-${subasta.id}`} auction={subasta} />)}
        </div>
        <Paginador
          page={pageActual}
          totalPages={totalPages}
          totalItems={totalItems}
          onChange={cambiarPagina}
          disabled={actividades.ocupado}
        />
      </>
    );
  };

  return (
    <div className="layout-container">
      <h1 style={{ marginBottom: '2rem' }}>Mis Actividades</h1>

      <div style={{ display: 'flex', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
        {Object.keys(TABS).map(renderTabButton)}
      </div>

      {activeTab === 'publicaciones' && renderMetricas()}

      {renderContenido()}
    </div>
  );
}
