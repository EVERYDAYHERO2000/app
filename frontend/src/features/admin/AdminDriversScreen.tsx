import { useEffect, useState } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { api } from '../../shared/api/client';
import { ScreenHeader } from '../../shared/ScreenHeader';

type Driver = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  carBrand: string | null;
  carPlateNumber: string | null;
};

export function AdminDriversScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<Driver[]>('/admin/drivers');
        if (!res.ok) throw new Error(res.error.message);
        if (!mounted) return;
        setDrivers(res.data as unknown as Driver[]);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Ошибка загрузки водителей');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <ScreenHeader title="Админка: водители" showUserAvatar />
      <Box sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper sx={{ p: 2, borderColor: 'error.main', borderWidth: 1, borderStyle: 'solid' }}>
            <Typography color="error" fontWeight={600}>
              Ошибка
            </Typography>
            <Typography color="text.secondary">{error}</Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {drivers.map((d) => (
              <Paper key={d.id} variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {d.name ?? '—'}
                </Typography>
                <Typography color="text.secondary">Телефон: {d.phone ?? '—'}</Typography>
                <Typography color="text.secondary">Email: {d.email ?? '—'}</Typography>
                <Typography color="text.secondary">
                  Авто: {d.carBrand ?? '—'} {d.carPlateNumber ?? ''}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </>
  );
}

