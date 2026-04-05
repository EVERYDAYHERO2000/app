import { useEffect, useState } from 'react';
import { api } from './api/client';
import { useDevUserId } from './useDevUserId';

export type MeResponse = {
  id: string;
  role: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  carBrand?: string | null;
  carPlateNumber?: string | null;
};

export function useMe() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { devUserId } = useDevUserId();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // В dev-режиме `session` cookie имеет `httpOnly`, поэтому `document.cookie` ее не видит.
        // Поэтому просто попробуем сходить за `/me` даже если `x-dev-user-id` не задан.
        const res = await api.get<MeResponse>('/me');
        if (!mounted) return;
        if (!res.ok) {
          // Если пользователь не авторизован — это нормально.
          setMe(null);
          setError(null);
          return;
        }
        setMe(res.data);
        setError(null);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Ошибка загрузки профиля');
        setMe(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [devUserId]);

  return { me, loading, error };
}

