const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const fechaHora = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' });
const relativo = new Intl.RelativeTimeFormat('es-AR', { numeric: 'auto' });

export function formatoARS(valor) {
  return moneda.format(Number(valor) || 0);
}

export function formatoFechaHora(iso) {
  if (!iso) return '';
  return fechaHora.format(new Date(iso));
}

export function formatoRelativo(iso, ahora = Date.now()) {
  if (!iso) return '';
  const segundos = Math.round((new Date(iso).getTime() - ahora) / 1000);
  const absoluto = Math.abs(segundos);
  if (absoluto < 45) return relativo.format(segundos, 'second');
  if (absoluto < 3600) return relativo.format(Math.round(segundos / 60), 'minute');
  if (absoluto < 86400) return relativo.format(Math.round(segundos / 3600), 'hour');
  return relativo.format(Math.round(segundos / 86400), 'day');
}

export function plural(cantidad, singular, pluralPalabra, cero = null) {
  const n = Number(cantidad) || 0;
  if (n === 0 && cero !== null) return cero;
  return `${n} ${n === 1 ? singular : pluralPalabra}`;
}

export function descomponerDuracion(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    total,
    horas: Math.floor(total / 3600),
    minutos: Math.floor((total % 3600) / 60),
    segundos: total % 60
  };
}

export function formatoDuracion(ms) {
  const { total, horas, minutos, segundos } = descomponerDuracion(ms);
  const dos = (n) => String(n).padStart(2, '0');
  if (total >= 86400) {
    const dias = Math.floor(horas / 24);
    return `${dias}d ${dos(horas % 24)}h ${dos(minutos)}m`;
  }
  if (horas > 0) return `${horas}h ${dos(minutos)}m ${dos(segundos)}s`;
  return `${dos(minutos)}:${dos(segundos)}`;
}
