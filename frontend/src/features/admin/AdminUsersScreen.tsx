import { useEffect, useState } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { api } from '../../shared/api/client';
import { ScreenHeader } from '../../shared/ScreenHeader';

type User = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
};

export function AdminUsersScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<User[]>('/admin/users');
        if (!res.ok) throw new Error(res.error.message);
        if (!mounted) return;
        setUsers(res.data as unknown as User[]);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Ошибка загрузки пользователей');
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
      <ScreenHeader title="Админка: пользователи" showUserAvatar />
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
            {users.map((u) => (
              <Paper key={u.id} variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {u.name ?? '—'}
                </Typography>
                <Typography color="text.secondary">Телефон: {u.phone ?? '—'}</Typography>
                <Typography color="text.secondary">Email: {u.email ?? '—'}</Typography>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </>
  );
}

