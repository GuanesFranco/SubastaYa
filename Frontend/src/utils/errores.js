export const TIPOS_ERROR = Object.freeze({
  RED: 'red',
  CANCELADO: 'cancelado',
  VALIDACION: 'validacion',
  NEGOCIO: 'negocio',
  CONFLICTO: 'conflicto',
  NO_ENCONTRADO: 'noEncontrado',
  NO_AUTORIZADO: 'noAutorizado',
  SERVIDOR: 'servidor',
  DESCONOCIDO: 'desconocido'
});

const MENSAJES_GENERICOS = {
  [TIPOS_ERROR.RED]: 'No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.',
  [TIPOS_ERROR.CANCELADO]: '',
  [TIPOS_ERROR.VALIDACION]: 'Revisá los datos ingresados.',
  [TIPOS_ERROR.NEGOCIO]: 'La operación no se pudo completar.',
  [TIPOS_ERROR.CONFLICTO]: 'Otra oferta superó la tuya, actualizá y reintentá.',
  [TIPOS_ERROR.NO_ENCONTRADO]: 'No encontramos lo que buscabas.',
  [TIPOS_ERROR.NO_AUTORIZADO]: 'Tu sesión venció. Iniciá sesión de nuevo.',
  [TIPOS_ERROR.SERVIDOR]: 'Algo falló de nuestro lado. Probá de nuevo en unos segundos.',
  [TIPOS_ERROR.DESCONOCIDO]: 'Ocurrió un error inesperado.'
};

export function crearError(mensaje, { status = null, kind = TIPOS_ERROR.DESCONOCIDO, errores = null } = {}) {
  const error = new Error(mensaje || MENSAJES_GENERICOS[kind] || MENSAJES_GENERICOS[TIPOS_ERROR.DESCONOCIDO]);
  error.status = status;
  error.kind = kind;
  error.errores = errores;
  return error;
}

export function clasificarError(status, data) {
  if (status === 401) return TIPOS_ERROR.NO_AUTORIZADO;
  if (status === 404) return TIPOS_ERROR.NO_ENCONTRADO;
  if (status === 409) return TIPOS_ERROR.CONFLICTO;
  if (status === 422) return TIPOS_ERROR.NEGOCIO;
  if (status === 400 && data && data.errors) return TIPOS_ERROR.VALIDACION;
  if (status === 400) return TIPOS_ERROR.NEGOCIO;
  if (status >= 500) return TIPOS_ERROR.SERVIDOR;
  return TIPOS_ERROR.DESCONOCIDO;
}

export function mensajeDeError(error) {
  if (!error) return MENSAJES_GENERICOS[TIPOS_ERROR.DESCONOCIDO];
  switch (error.kind) {
    case TIPOS_ERROR.RED:
    case TIPOS_ERROR.SERVIDOR:
    case TIPOS_ERROR.NO_AUTORIZADO:
      return MENSAJES_GENERICOS[error.kind];
    case TIPOS_ERROR.CANCELADO:
      return '';
    case TIPOS_ERROR.VALIDACION:
    case TIPOS_ERROR.NEGOCIO:
    case TIPOS_ERROR.CONFLICTO:
    case TIPOS_ERROR.NO_ENCONTRADO:
    case TIPOS_ERROR.DESCONOCIDO:
    default:
      return error.message || MENSAJES_GENERICOS[TIPOS_ERROR.DESCONOCIDO];
  }
}

export function esErrorDeBloque(error) {
  if (!error) return false;
  return error.kind === TIPOS_ERROR.RED
    || error.kind === TIPOS_ERROR.SERVIDOR
    || error.kind === TIPOS_ERROR.NO_ENCONTRADO
    || error.kind === TIPOS_ERROR.DESCONOCIDO;
}

export function esCancelacion(error) {
  return Boolean(error) && error.kind === TIPOS_ERROR.CANCELADO;
}

export function errorDeCampo(error, campo) {
  if (!error || !error.errores) return '';
  return error.errores[campo] || '';
}
