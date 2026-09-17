import { useContext } from 'react';
import SaldoContext from '../context/saldoContext';

export default function useSaldo() {
  const contexto = useContext(SaldoContext);
  if (!contexto) {
    throw new Error('useSaldo debe usarse dentro de un SaldoProvider');
  }
  return contexto;
}
