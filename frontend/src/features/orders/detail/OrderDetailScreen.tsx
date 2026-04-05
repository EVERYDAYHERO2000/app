import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Paper, Chip, CircularProgress, Stack } from '@mui/material';
import { api } from '../../../shared/api/client';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { ScreenHeader } from '../../../shared/ScreenHeader';

export function OrderDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) return;
        setLoading(true);
        const res = await api.get(`/orders/${id}`);
        if (!res.ok) throw new Error(res.error.message);
        if (!mounted) return;
        setOrder(res.data);
        setError(null);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Ошибка загрузки заказа');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const statusLabel = useMemo(() => {
    if (!order?.status) return '';
    const map: Record<string, string> = {
      NEW: 'Новый',
      ACCEPTED: 'Принят в работу',
      CONFIRMED: 'Подтвержден',
      REJECTED: 'Отклонен',
      IN_PROGRESS: 'В работе',
      COMPLETED: 'Выполнен',
    };
    return map[order.status] ?? order.status;
  }, [order?.status]);

  const statusColor = useMemo((): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
    const s = order?.status as string | undefined;
    if (!s) return 'default';
    if (s === 'COMPLETED') return 'success';
    if (s === 'REJECTED') return 'error';
    if (s === 'IN_PROGRESS') return 'primary';
    if (s === 'ACCEPTED' || s === 'CONFIRMED') return 'warning';
    return 'default';
  }, [order?.status]);

  const headerTitle = useMemo(() => {
    if (!id) return 'Заказ';
    return `Заказ #${String(id).slice(-6)}`;
  }, [id]);

  return (
    <>
      <ScreenHeader
        title={headerTitle}
        leftAction={{ label: 'Назад', onClick: () => navigate('/orders') }}
      />

      <Box sx={{ p: 2 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 3, borderColor: 'error.main', borderWidth: 1, borderStyle: 'solid' }}>
          <Typography color="error" fontWeight={700}>
            Ошибка
          </Typography>
          <Typography color="text.secondary">{error}</Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Заказ #{String(id).slice(-6)}
              </Typography>
              <Typography color="text.secondary">
                Дата создания: {order?.createdAt ? new Date(order.createdAt).toLocaleString('ru-RU') : '—'}
              </Typography>
            </Box>
            {order?.status ? (
              <Chip
                label={statusLabel}
                color={statusColor}
                size="small"
                icon={<LocalShippingIcon fontSize="small" />}
              />
            ) : null}
          </Stack>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
              Информация о заказе
            </Typography>
            <Stack spacing={0.75}>
              <Typography color="text.secondary">
                Материал:{' '}
                <b>{order?.materialNameSnapshot ?? order?.material ?? '—'}</b>
                {order?.submaterialNameSnapshot ? (
                  <>
                    {' '}
                    / <b>{order.submaterialNameSnapshot}</b>
                  </>
                ) : null}
              </Typography>
              <Typography color="text.secondary">
                Объем: <b>{order?.volume ?? '—'} м³</b>
              </Typography>
              <Typography color="text.secondary">
                Дата доставки:{' '}
                <b>
                  {order?.deliveryDate ? new Date(order.deliveryDate).toLocaleString('ru-RU') : '—'}
                </b>
              </Typography>
              <Typography color="text.secondary">
                Адрес: <b>{order?.address ?? '—'}</b>
              </Typography>
              {order?.comment ? (
                <Typography color="text.secondary">
                  Комментарий: <b>{order.comment}</b>
                </Typography>
              ) : null}
              {order?.phone ? (
                <Typography color="text.secondary">
                  Телефон: <b>{order.phone}</b>
                </Typography>
              ) : null}
            </Stack>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
              Отслеживание груза
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography color="text.secondary">
                В MVP отображение трекинга (карта/маршрут) будет подключено позже. Сейчас показываем статус: {statusLabel}.
              </Typography>
            </Paper>
          </Box>
        </Paper>
      )}
      </Box>
    </>
  );
}
