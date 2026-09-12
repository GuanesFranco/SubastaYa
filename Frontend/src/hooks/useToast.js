import { useContext } from 'react';
import ToastContext from '../context/toastContext';

export default function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  return contexto;
}
