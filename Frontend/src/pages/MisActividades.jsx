import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AuctionCard from '../components/AuctionCard';
import Paginador from '../components/Paginador';
import Skeleton from '../components/Skeleton';
import EstadoVacio from '../components/EstadoVacio';
import EstadoError from '../components/EstadoError';
import useRecurso from '../hooks/useRecurso';
import useTitulo from '../hooks/useTitulo';
import { formatoARS, plural } from '../utils/formato';
import './MisActividades.css';

const PAGE_SIZE = 12;
const TOPE_METRICAS = 100;

const TABS = [
  { id: 'pujas', recurso: '/users/me/bids', label: 'Donde participé' },
  { id: 'publicaciones', recurso: '/users/me/auctions', label: 'Mis publicaciones' }
];

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
  useTitulo('Mis actividades');

  const [activeTab, setActiveTab] = useState('pujas');
  const [paginas, setPaginas] = useState({ pujas: 1, publicaciones: 1 });
  const tabsRef = useRef([]);

  const tab = TABS.find((t) => t.id === activeTab) || TABS[0];
  const pageActual = paginas[activeTab];

  const actividades = useRecurso(async (signal) => {
    const res = await api.get(tab.recurso, { params: { page: pageActual, pageSize: PAGE_SIZE }, signal });
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

  const manejarTeclas = (e) => {
    const indice = TABS.findIndex((t) => t.id === activeTab);
    let siguiente = indice;
    if (e.key === 'ArrowRight') siguiente = (indice + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') siguiente = (indice - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') siguiente = 0;
    else if (e.key === 'End') siguiente = TABS.length - 1;
    else return;
    e.preventDefault();
    setActiveTab(TABS[siguiente].id);
    const boton = tabsRef.current[siguiente];
    if (boton) boton.focus();
  };

  const items = actividades.datos ? actividades.datos.items || [] : [];
  const totalPages = actividades.datos ? actividades.datos.totalPages || 0 : 0;
  const totalItems = actividades.datos ? actividades.datos.totalItems || 0 : 0;

  const renderMetricas = () => {
    if (metricas.cargando) {
      return <Skeleton variante="metricas" cantidad={4} etiqueta="Cargando métricas" />;
    }
    if (!metricas.datos) return null;
    const m = metricas.datos;

    return (
      <div className="metricas">
        <div className="glass-panel metrica metrica--principal">
          <span className="metrica__etiqueta">Recaudado</span>
          <strong className="metrica__valor">{formatoARS(m.recaudado)}</strong>
          <span className="metrica__nota">{plural(m.vendidas, 'subasta vendida', 'subastas vendidas', 'Ninguna venta todavía')}</span>
        </div>
        <div className="glass-panel metrica">
          <span className="metrica__etiqueta">En curso</span>
          <strong className="metrica__valor">{m.enCurso}</strong>
        </div>
        <div className="glass-panel metrica">
          <span className="metrica__etiqueta">Publicadas</span>
          <strong className="metrica__valor">{m.totalPublicadas}</strong>
        </div>
        {m.parcial && (
          <p className="metricas__aviso">La recaudación se calcula sobre tus primeras {TOPE_METRICAS} publicaciones.</p>
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
    <div className="layout-container actividades">
      <h1 className="actividades__titulo">Mis actividades</h1>

      <div className="tabs" role="tablist" aria-label="Secciones de mis actividades" onKeyDown={manejarTeclas}>
        {TABS.map((t, i) => {
          const activo = t.id === activeTab;
          return (
            <button
              key={t.id}
              ref={(el) => { tabsRef.current[i] = el; }}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={activo}
              aria-controls={`panel-${t.id}`}
              tabIndex={activo ? 0 : -1}
              className={`tabs__boton${activo ? ' tabs__boton--activo' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`} className="actividades__panel">
        {activeTab === 'publicaciones' && renderMetricas()}
        {renderContenido()}
      </div>
    </div>
  );
}
