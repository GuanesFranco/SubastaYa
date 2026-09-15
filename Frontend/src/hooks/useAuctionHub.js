import useHubConexion, { ESTADOS_CONEXION } from './useHubConexion';

export { ESTADOS_CONEXION };

export default function useAuctionHub(subastaId, handlers) {
  return useHubConexion({
    clave: `subasta:${subastaId}`,
    habilitado: Boolean(subastaId),
    unirse: (conn) => conn.invoke('JoinAuctionGroup', subastaId),
    salir: (conn) => conn.invoke('LeaveAuctionGroup', subastaId),
    handlers
  });
}
