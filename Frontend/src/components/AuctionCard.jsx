import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';
import { formatoARS, plural } from '../utils/formato';
import './AuctionCard.css';

const ETIQUETA_ESTADO = {
  Activa: 'En vivo',
  Programada: 'Próximamente',
  Finalizada: 'Finalizada',
  Desierta: 'Sin ofertas'
};

const ETIQUETA_PRECIO = {
  Activa: 'Precio actual',
  Programada: 'Precio inicial',
  Finalizada: 'Precio final',
  Desierta: 'Precio base'
};

export default function AuctionCard({ auction }) {
  const [imagenRota, setImagenRota] = useState(false);

  const estado = auction.estado;
  const mostrarImagen = Boolean(auction.urlImagen) && !imagenRota;
  const inicial = (auction.categoriaNombre || auction.titulo || 'S').trim().charAt(0).toUpperCase();
  const precio = auction.montoFinal ?? auction.precioActual ?? auction.precioBase ?? 0;
  const tieneConteo = auction.cantidadPujas !== undefined && auction.cantidadPujas !== null;
  const idTitulo = `subasta-${auction.id}-titulo`;
  const idPrecio = `subasta-${auction.id}-precio`;
  const idCta = `subasta-${auction.id}-cta`;

  return (
    <Link
      to={`/subasta/${auction.id}`}
      className="auction-card"
      data-estado={estado}
      aria-labelledby={`${idTitulo} ${idPrecio} ${idCta}`}
    >
      <div className="auction-card__media">
        {mostrarImagen ? (
          <img
            className="auction-card__imagen"
            src={auction.urlImagen}
            alt=""
            loading="lazy"
            onError={() => setImagenRota(true)}
          />
        ) : (
          <div className="auction-card__fallback" aria-hidden="true">{inicial}</div>
        )}

        <span className="auction-card__estado">
          <span className="auction-card__punto" aria-hidden="true" />
          {ETIQUETA_ESTADO[estado] || estado}
        </span>

        {auction.esGanador && (
          <span className="auction-card__ganaste">Ganaste</span>
        )}
      </div>

      <div className="auction-card__cuerpo">
        <span className="auction-card__categoria">{auction.categoriaNombre || 'General'}</span>
        <h3 className="auction-card__titulo" id={idTitulo}>{auction.titulo}</h3>

        <div className="auction-card__precio">
          <span className="auction-card__precio-etiqueta">{ETIQUETA_PRECIO[estado] || 'Precio'}</span>
          <strong className="auction-card__precio-valor" id={idPrecio}>{formatoARS(precio)}</strong>
        </div>

        <div className="auction-card__pie">
          <span className="auction-card__ofertas">
            {tieneConteo ? plural(auction.cantidadPujas, 'oferta', 'ofertas', 'Sin ofertas') : ''}
          </span>
          <CountdownTimer fechaFin={auction.fechaFin} estado={estado} tamano="sm" />
        </div>
      </div>

      <span className="auction-card__cta" id={idCta}>
        Ver subasta
        <svg viewBox="0 0 20 20">
          <path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}
