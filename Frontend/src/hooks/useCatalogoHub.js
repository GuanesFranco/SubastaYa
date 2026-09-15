import useHubConexion from './useHubConexion';

export default function useCatalogoHub(handlers, habilitado = true) {
  return useHubConexion({
    clave: 'catalogo',
    habilitado,
    unirse: (conn) => conn.invoke('JoinCatalogGroup'),
    salir: (conn) => conn.invoke('LeaveCatalogGroup'),
    handlers
  });
}
