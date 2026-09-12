export const ESTADOS_SUBASTA = Object.freeze(['Programada', 'Activa', 'Finalizada', 'Desierta']);

export function normalizarEstado(valor) {
  if (typeof valor === 'number') return ESTADOS_SUBASTA[valor] || String(valor);
  return valor;
}

export function montoSugerido(subasta) {
  if (!subasta) return 0;
  const base = subasta.precioActual || subasta.precioBase || 0;
  return base + (subasta.incrementoMinimo || 0);
}
