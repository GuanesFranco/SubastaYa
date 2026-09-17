import { useEffect, useRef } from 'react';

export default function useLatest(valor) {
  const ref = useRef(valor);
  useEffect(() => {
    ref.current = valor;
  });
  return ref;
}
