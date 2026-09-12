import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AuctionCard from '../components/AuctionCard';
import Paginador from '../components/Paginador';

const PAGE_SIZE = 12;
const TOPE_METRICAS = 100;

const vacio = { items: [], totalPages: 0, totalItems: 0 };

export default function MisActividades() {
  const [activeTab, setActiveTab] = useState('pujas'); // 'pujas' o 'publicaciones'

  const [pujas, setPujas] = useState(vacio);
  const [publicaciones, setPublicaciones] = useState(vacio);
  const [pagePujas, setPagePujas] = useState(1);
  const [pagePublicaciones, setPagePublicaciones] = useState(1);

  const [metricas, setMetricas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const pageActual = activeTab === 'pujas' ? pagePujas : pagePublicaciones;
  const datosActuales = activeTab === 'pujas' ? pujas : publicaciones;

  const fetchTab = async () => {
    try {
      setLoading(true);
      setError('');

      const recurso = activeTab === 'pujas' ? '/users/me/bids' : '/users/me/auctions';
      const res = await api.get(`${recurso}?page=${pageActual}&pageSize=${PAGE_SIZE}`);

      const datos = {
        items: res.data.items || [],
        totalPages: res.data.totalPages || 0,
        totalItems: res.data.totalItems || 0
      };

      if (activeTab === 'pujas') setPujas(datos);
      else setPublicaciones(datos);
    } catch (err) {
      setError('Error al cargar tus actividades: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const fetchMetricas = async () => {
    try {
      const res = await api.get(`/users/me/auctions?page=1&pageSize=${TOPE_METRICAS}`);
      const items = res.data.items || [];
      const total = res.data.totalItems ?? items.length;
      const vendidas = items.filter(s => s.estado === 'Finalizada' && s.montoFinal != null);

      setMetricas({
        totalPublicadas: total,
        vendidas: vendidas.length,
        recaudado: vendidas.reduce((acc, s) => acc + Number(s.montoFinal), 0),
        enCurso: items.filter(s => s.estado === 'Activa' || s.estado === 'Programada').length,
        parcial: total > items.length
      });
    } catch {
      setMetricas(null);
    }
  };

  useEffect(() => {
    fetchTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pageActual]);

  useEffect(() => {
    fetchMetricas();
  }, []);

  const cambiarPagina = (destino) => {
    if (activeTab === 'pujas') setPagePujas(destino);
    else setPagePublicaciones(destino);
  };

  const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

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

  const renderMetrica = (etiqueta, valor, color) => (
    <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>{etiqueta}</p>
      <h2 style={{ fontSize: '2rem', margin: 0, color: color || 'var(--text-main)' }}>{valor}</h2>
    </div>
  );

  return (
    <div className="layout-container">
      <h1 style={{ marginBottom: '2rem' }}>Mis Actividades</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <div style={{ display: 'flex', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
        {renderTabButton('pujas', 'Subastas donde participé')}
        {renderTabButton('publicaciones', 'Mis Publicaciones')}
      </div>

      {activeTab === 'publicaciones' && metricas && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {renderMetrica('Recaudado', formatter.format(metricas.recaudado), 'var(--success)')}
            {renderMetrica('Vendidas', metricas.vendidas, 'var(--accent-primary)')}
            {renderMetrica('En curso', metricas.enCurso, 'var(--warning)')}
            {renderMetrica('Publicadas', metricas.totalPublicadas)}
          </div>
          {metricas.parcial && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.75rem', textAlign: 'center' }}>
              La recaudación se calcula sobre tus primeras {TOPE_METRICAS} publicaciones.
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando datos...</div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {activeTab === 'pujas' && (
              pujas.items.length === 0 ? (
                <p style={{ gridColumn: '1 / -1', color: 'var(--text-muted)' }}>No has participado en ninguna subasta todavía.</p>
              ) : (
                // MisPujasDto devuelve un resumen, lo mapeamos al formato de AuctionCard
                pujas.items.map(puja => (
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
              publicaciones.items.length === 0 ? (
                <p style={{ gridColumn: '1 / -1', color: 'var(--text-muted)' }}>No has publicado ninguna subasta todavía.</p>
              ) : (
                // SubastaResumenDto ya tiene el formato directo para AuctionCard
                publicaciones.items.map(subasta => (
                  <AuctionCard key={`pub-${subasta.id}`} auction={subasta} />
                ))
              )
            )}
          </div>

          <Paginador
            page={pageActual}
            totalPages={datosActuales.totalPages}
            totalItems={datosActuales.totalItems}
            onChange={cambiarPagina}
            disabled={loading}
          />
        </>
      )}
    </div>
  );
}
