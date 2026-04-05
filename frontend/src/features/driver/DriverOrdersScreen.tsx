import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Chip, CircularProgress, Stack, Tabs, Tab, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { api } from '../../shared/api/client';
import { ScreenHeader } from '../../shared/ScreenHeader';

type OrderStatus = 'NEW' | 'ACCEPTED' | 'CONFIRMED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED';

type Order = {
  id: string;
  driverId: string | null;
  status: OrderStatus;
  material: string;
  materialSubtype?: string | null;
  materialNameSnapshot?: string | null;
  submaterialNameSnapshot?: string | null;
  volume: number;
  deliveryDate: string;
  address: string;
  totalPrice?: string | number | null;
};

function formatMaterialRu(material: string) {
  const m: Record<string, string> = { sand: 'Песок', gravel: 'Щебень', asphalt: 'Асфальт' };
  return m[material] ?? material;
}

function formatStatusRu(status: OrderStatus) {
  const map: Record<OrderStatus, string> = {
    NEW: 'Новый',
    ACCEPTED: 'Принят в работу',
    CONFIRMED: 'Подтвержден',
    REJECTED: 'Отклонен',
    IN_PROGRESS: 'В работе',
    COMPLETED: 'Выполнен',
  };
  return map[status] ?? status;
}

function statusColor(status: OrderStatus): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' {
  if (status === 'COMPLETED') return 'success';
  if (status === 'REJECTED') return 'error';
  if (status === 'IN_PROGRESS') return 'primary';
  if (status === 'ACCEPTED' || status === 'CONFIRMED') return 'warning';
  return 'default';
}

function formatDeliveryDateSmart(rawDate?: string) {
  if (!rawDate) return '';
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();
  const baseText = date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  });

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 1) return `${baseText}, завтра`;
  if (diffDays === 2) return `${baseText}, послезавтра`;
  return baseText;
}

export function DriverOrdersScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState(0);
  const [takingOrderId, setTakingOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Order[]>('/driver/orders');
      if (!res.ok) throw new Error(res.error.message);
      setOrders(res.data as unknown as Order[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const completed = new Set<OrderStatus>(['COMPLETED']);
    const inWork = new Set<OrderStatus>(['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS']);

    // "Новые" = заказ еще не взят никем.
    if (statusTab === 0) return orders.filter((o) => o.driverId === null && o.status === 'NEW');
    // "В работе" = заказ взят этим водителем.
    if (statusTab === 1) return orders.filter((o) => o.driverId !== null && inWork.has(o.status));
    // "Выполненые" = заказ взят этим водителем и завершен.
    return orders.filter((o) => o.driverId !== null && completed.has(o.status));
  }, [orders, statusTab]);

  const empty = useMemo(() => !loading && filteredOrders.length === 0, [loading, filteredOrders.length]);

  const handleTakeOrder = async (orderId: string) => {
    if (takingOrderId) return;
    setTakingOrderId(orderId);
    setError(null);
    try {
      const res = await api.post('/driver/orders/' + orderId + '/take', {});
      if (!res.ok) throw new Error(res.error.message);
      await fetchOrders();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось взять заказ');
    } finally {
      setTakingOrderId(null);
    }
  };

  return (
    <>
      <ScreenHeader
        title="Водитель: мои заказы"
        showUserAvatar
        rightAction={{ label: 'Новый заказ', onClick: () => navigate('/orders/new') }}
      />

      <Box sx={{ px: 2, pb: 2 }}>
        <Box
          sx={{
            position: 'sticky',
            top: { xs: 56, sm: 64 },
            zIndex: (t) => t.zIndex.appBar - 1,
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            mb: 2,
          }}
        >
          <Tabs
            value={statusTab}
            onChange={(_e, v) => setStatusTab(v)}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab value={0} label="Новые" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }} />
            <Tab value={1} label="В работе" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }} />
            <Tab value={2} label="Выполненые" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }} />
          </Tabs>
        </Box>

        <Stack spacing={2}>
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
        ) : empty ? (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Назначенных заказов нет
            </Typography>
            <Typography color="text.secondary">Ожидайте назначения.</Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {filteredOrders.map((order, index) => {
              const materialLabel = order.materialNameSnapshot ?? formatMaterialRu(order.material);
              const submaterialLabel = order.submaterialNameSnapshot ?? order.materialSubtype ?? '';
              const title = `${submaterialLabel || materialLabel}, ${order.volume} м³`;
              const dateText = formatDeliveryDateSmart(order.deliveryDate);
              const totalPrice = Number(order.totalPrice ?? 0);
              const totalPriceText = Number.isFinite(totalPrice) && totalPrice > 0 ? `${totalPrice.toLocaleString('ru-RU')} ₽` : '—';
              const isFirst = index === 0;
              const isLast = index === filteredOrders.length - 1;

              const canTake = order.driverId === null && order.status === 'NEW';

              return (
                <Paper
                  key={order.id}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    position: 'relative',
                    border: 1,
                    borderStyle: 'solid',
                    borderColor: 'divider',
                    borderTopWidth: isFirst ? 1 : 0,
                    borderRadius: 0,
                    borderTopLeftRadius: isFirst ? '8px' : 0,
                    borderTopRightRadius: isFirst ? '8px' : 0,
                    borderBottomLeftRadius: isLast ? '8px' : 0,
                    borderBottomRightRadius: isLast ? '8px' : 0,
                  }}
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <Chip
                    label={formatStatusRu(order.status)}
                    color={statusColor(order.status)}
                    size="small"
                    sx={{ position: 'absolute', top: 12, right: 12, whiteSpace: 'nowrap' }}
                  />

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {title}
                      </Typography>
                      <Typography color="text.secondary">
                        №{order.id.slice(-6)} • {dateText || 'Дата доставки не указана'}
                      </Typography>
                      <Typography color="text.secondary">{order.address || 'Адрес не указан'}</Typography>
                      <Typography color="text.secondary">
                        <b>{totalPriceText}</b>
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                      {canTake ? (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleTakeOrder(order.id);
                          }}
                          disabled={takingOrderId === order.id}
                        >
                          Взять
                        </Button>
                      ) : null}
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
        </Stack>
      </Box>
    </>
  );
}
