import React, { useState } from 'react';
import CountdownTimer from '../CountdownTimer';
import IndicadorConexion from './IndicadorConexion';
import { formatoARS, formatoDuracion, formatoFechaHora } from '../../utils/formato';
import { ETIQUETA_ESTADO, ETIQUETA_PRECIO } from '../../utils/subastas';

const DESCRIPCION_CORTA = 300;

export default function EncabezadoSubasta({ subasta, ultimoMinuto, estadoConexion, onReconectar, extension, onExtensionFin }) {
  const [imagenRota, setImagenRota] = useState(false);
  const activa = subasta.estado === 'Activa';
  const mostrarImagen = Boolean(subasta.urlImagen) && !imagenRota;
  const precio = subasta.precioActual || subasta.precioBase || 0;
  const [precioInicial] = useState(precio);
  const precioCambio = precio !== precioInicial;
  const [descripcionCompleta, setDescripcionCompleta] = useState(false);
  const descripcion = subasta.descripcion || '';
  const descripcionLarga = descripcion.length > DESCRIPCION_CORTA + 60;
  const textoDescripcion = descripcionLarga && !descripcionCompleta
    ? `${descripcion.slice(0, DESCRIPCION_CORTA).trimEnd()}…`
    : descripcion;

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
      {descripcion && (
        <p className="encabezado__descripcion">
          {textoDescripcion}
          {descripcionLarga && (
            <>
              {' '}
              <button
                type="button"
                className="encabezado__ver-mas"
                onClick={() => setDescripcionCompleta((v) => !v)}
                aria-expanded={descripcionCompleta}
              >
                {descripcionCompleta ? 'Ver menos' : 'Ver más'}
              </button>
            </>
          )}
        </p>
      )}

      <div className="encabezado__cifras">
        <div className="cifra">
          <span className="cifra__etiqueta">{ETIQUETA_PRECIO[subasta.estado] || 'Precio'}</span>
          <strong
            key={precio}
            className={`cifra__valor cifra__valor--precio${precioCambio ? ' cifra__valor--latido' : ''}`}
          >
            {formatoARS(precio)}
          </strong>
        </div>
        <div className="cifra">
          <span className="cifra__etiqueta">
            {subasta.estado === 'Programada' ? 'Empieza' : 'Tiempo restante'}
          </span>
          {subasta.estado === 'Programada' ? (
            <strong className="cifra__valor cifra__valor--fecha">{formatoFechaHora(subasta.fechaInicio)}</strong>
          ) : (
            <span className="cifra__reloj">
              <span key={extension ? `latido-${extension.id}` : 'reloj'} className={`cifra__reloj-interno${extension ? ' cifra__reloj-interno--latido' : ''}`}>
                <CountdownTimer fechaFin={subasta.fechaFin} estado={subasta.estado} tamano="lg" conIcono={false} />
              </span>
              {extension && (
                <span
                  key={`extension-${extension.id}`}
                  className="cifra__extension"
                  onAnimationEnd={onExtensionFin}
                  aria-hidden="true"
                >
                  {extension.ms > 0 ? `+${formatoDuracion(extension.ms)}` : '+ tiempo'}
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {activa && ultimoMinuto && (
        <span className="visualmente-oculto" role="status" aria-live="assertive">
          Queda menos de un minuto para el cierre.
        </span>
      )}
    </section>
  );
}
