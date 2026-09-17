import { useContext } from 'react';
import TemaContext from '../context/temaContext';

export default function useTema() {
  const contexto = useContext(TemaContext);
  if (!contexto) {
    throw new Error('useTema debe usarse dentro de un TemaProvider');
  }
  return contexto;
}
