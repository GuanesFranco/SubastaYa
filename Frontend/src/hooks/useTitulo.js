import { useEffect } from 'react';

const NOMBRE_APP = 'SubastaYa';

export default function useTitulo(titulo) {
  useEffect(() => {
    const anterior = document.title;
    document.title = titulo ? `${titulo} · ${NOMBRE_APP}` : NOMBRE_APP;
    return () => {
      document.title = anterior;
    };
  }, [titulo]);
}
