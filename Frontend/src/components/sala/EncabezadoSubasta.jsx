import React, { useState } from 'react';
import CountdownTimer from '../CountdownTimer';
import IndicadorConexion from './IndicadorConexion';
import { formatoARS, formatoFechaHora } from '../../utils/formato';

const ETIQUETA_ESTADO = {
  Activa: 'En vivo',
  Programada: 'Próximamente',
  Finalizada: 'Finalizada',
  Desierta: 'Desierta'
};

const ETIQUETA_PRECIO = {
  Activa: 'Precio actual',
  Programada: 'Precio inicial',
  Finalizada: 'Precio final',
  Desierta: 'Precio base'
};

export default function EncabezadoSubasta({ subasta, ultimoMinuto, estadoConexion, onReconectar }) {
  const [imagenRota, setImagenRota] = useState(false);
  const activa = subasta.estado === 'Activa';
  const mostrarImagen = Boolean(subasta.urlImagen) && !imagenRota;
  const precio = subasta.precioActual || subasta.precioBase || 0;

  return (
    <section className="glass-panel encabezado" data-fase={activa && ultimoMinuto ? 'critica' : 'normal'} data-estado={subasta.estado}>
      <div className="encabezado__superior">
        <span className="encabezado__categoria">{subasta.categoriaNombre || 'General'}</span>
        <div className="encabezado__indicadores">
          <span className="encabezado__estado">
            <span className="encabezado__punto" aria-hidden="true" />
            {ETIQUETA_ESTADO[subasta.estado] || subasta.estado}
          </span>
          {activa && <IndicadorConexion estado={estadoConexion} onReconectar={onReconectar} />}
        </div>
      </div>

      {mostrarImagen && (
        <div className="encabezado__media">
          <img
            src={subasta.urlImagen}
            alt={subasta.titulo}
            onError={() => setImagenRota(true)}
          />
        </div>
      )}

      <h1 className="encabezado__titulo">{subasta.titulo}</h1>
      {subasta.vendedorNombre && (
        <p className="encabezado__vendedor">Publicada por <strong>{subasta.vendedorNombre}</strong></p>
      )}
      {subasta.descripcion && (
        <p className="encabezado__descripcion">{subasta.descripcion}</p>
      )}

      <div className="encabezado__cifras">
        <div className="cifra">
          <span className="cifra__etiqueta">{ETIQUETA_PRECIO[subasta.estado] || 'Precio'}</span>
          <strong className="cifra__valor cifra__valor--precio">{formatoARS(precio)}</strong>
        </div>
        <div className="cifra">
          <span className="cifra__etiqueta">
            {subasta.estado === 'Programada' ? 'Empieza' : 'Tiempo restante'}
          </span>
          {subasta.estado === 'Programada' ? (
            <strong className="cifra__valor cifra__valor--fecha">{formatoFechaHora(subasta.fechaInicio)}</strong>
          ) : (
            <CountdownTimer fechaFin={subasta.fechaFin} estado={subasta.estado} tamano="lg" conIcono={false} />
          )}
        </div>
      </div>
    </section>
  );
}
