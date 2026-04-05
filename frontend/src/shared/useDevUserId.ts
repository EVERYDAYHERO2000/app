import { useEffect, useMemo, useState } from 'react';
import { DEV_USER_ID_STORAGE_KEY } from './devUsers';

function getInitialDevUserId() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem(DEV_USER_ID_STORAGE_KEY) ?? undefined;
}

export function useDevUserId() {
  const [devUserId, setDevUserId] = useState<string | undefined>(() => getInitialDevUserId());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== DEV_USER_ID_STORAGE_KEY) return;
      setDevUserId(e.newValue ?? undefined);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const updateDevUserId = useMemo(
    () => (id: string) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(DEV_USER_ID_STORAGE_KEY, id);
      }
      setDevUserId(id);
    },
    []
  );

  return { devUserId, updateDevUserId };
}

