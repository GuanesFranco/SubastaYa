export const ESTADOS_SUBASTA = Object.freeze(['Programada', 'Activa', 'Finalizada', 'Desierta']);

export const ETIQUETA_ESTADO = Object.freeze({
  Activa: 'En vivo',
  Programada: 'Próximamente',
  Finalizada: 'Finalizada',
  Desierta: 'Sin ofertas'
});

export const ETIQUETA_PRECIO = Object.freeze({
  Activa: 'Precio actual',
  Programada: 'Precio inicial',
  Finalizada: 'Precio final',
  Desierta: 'Precio base'
});

export function normalizarEstado(valor) {
  if (typeof valor === 'number') return ESTADOS_SUBASTA[valor] || String(valor);
  return valor;
}

export function montoSugerido(subasta) {
  if (!subasta) return 0;
  const base = subasta.precioActual || subasta.precioBase || 0;
  return base + (subasta.incrementoMinimo || 0);
}
