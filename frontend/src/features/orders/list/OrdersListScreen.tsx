import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Chip, CircularProgress, Stack, Tabs, Tab, Button, Badge, Fab } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../shared/api/client';
import AddIcon from '@mui/icons-material/Add';
import { ScreenHeader } from '../../../shared/ScreenHeader';
import { useMe } from '../../../shared/useMe';

type OrderStatus = 'NEW' | 'ACCEPTED' | 'CONFIRMED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED';

type Order = {
  id: string;
  driverId?: string | null;
  status: OrderStatus;
  material: string;
  materialSubtype?: string | null;
  materialNameSnapshot?: string | null;
  submaterialNameSnapshot?: string | null;
  volume: number;
  deliveryDate: string;
  address: string;
  totalPrice?: string | number | null;
  phone?: string;
  comment?: string | null;
  createdAt?: string;
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

export function OrdersListScreen() {
  const navigate = useNavigate();
  const { me } = useMe();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState(0);
  const [takingOrderId, setTakingOrderId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        if (!me?.role) {
          setOrders([]);
          setError(null);
          return;
        }

        const role = me.role;
        const res =
          role === 'CLIENT'
            ? await api.get<Order[]>('/orders/my')
            : role === 'DRIVER'
              ? await api.get<Order[]>('/driver/orders')
              : await api.get<Order[]>('/admin/orders');

        if (!res.ok) throw new Error(res.error.message);
        if (!mounted) return;
        setOrders(res.data as unknown as Order[]);
        setError(null);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Ошибка загрузки заказов');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [me?.role]);

  useEffect(() => {
    // При смене роли сбрасываем вкладку.
    setStatusTab(0);
  }, [me?.role]);

  const role = me?.role as 'CLIENT' | 'DRIVER' | 'ADMIN' | undefined;

  const filteredOrders = useMemo(() => {
    const completed = new Set<OrderStatus>(['COMPLETED', 'REJECTED']);
    const inWork = new Set<OrderStatus>(['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS']);

    if (role === 'DRIVER') {
      // "Новые" = заказы, которые еще не взял никто.
      if (statusTab === 0) return orders.filter((o) => o.driverId == null && o.status === 'NEW');
      // "В работе" = взяты этим водителем.
      if (statusTab === 1) return orders.filter((o) => o.driverId != null && inWork.has(o.status));
      // "Выполненые" = взяты этим водителем и завершены.
      return orders.filter((o) => o.driverId != null && completed.has(o.status));
    }

    if (role === 'ADMIN') {
      // В админке:
      // "Все" = любые, но НЕ завершенные/отклоненные
      if (statusTab === 0) return orders.filter((o) => !completed.has(o.status));
      // "Новые"
      if (statusTab === 1) return orders.filter((o) => o.status === 'NEW');
      // "В работе"
      if (statusTab === 2) return orders.filter((o) => inWork.has(o.status));
      // "Завершенные"
      return orders.filter((o) => completed.has(o.status));
    }

    // CLIENT (по умолчанию)
    if (statusTab === 0) return orders.filter((o) => !completed.has(o.status));
    return orders.filter((o) => completed.has(o.status));
  }, [orders, statusTab, role]);

  const tabCounts = useMemo(() => {
    const completed = new Set<OrderStatus>(['COMPLETED', 'REJECTED']);
    const inWork = new Set<OrderStatus>(['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS']);

    const countNew = () => orders.filter((o) => !completed.has(o.status)).length;
    const countDone = () => orders.filter((o) => completed.has(o.status)).length;

    if (role === 'DRIVER') {
      return {
        0: orders.filter((o) => o.driverId == null && o.status === 'NEW').length,
        1: orders.filter((o) => o.driverId != null && inWork.has(o.status)).length,
        2: orders.filter((o) => o.driverId != null && completed.has(o.status)).length,
      } as Record<0 | 1 | 2, number>;
    }

    if (role === 'ADMIN') {
      const countAll = orders.filter((o) => !completed.has(o.status)).length;
      const countOnlyNew = orders.filter((o) => o.status === 'NEW').length;
      const countOnlyInWork = orders.filter((o) => inWork.has(o.status)).length;
      const countOnlyDone = orders.filter((o) => completed.has(o.status)).length;
      return {
        0: countAll,
        1: countOnlyNew,
        2: countOnlyInWork,
        3: countOnlyDone,
      } as Record<0 | 1 | 2 | 3, number>;
    }

    // CLIENT
    return {
      0: countNew(),
      1: countDone(),
    } as Record<0 | 1, number>;
  }, [orders, role]);

  const count0 = (tabCounts as any)[0] ?? 0;
  const count1 = (tabCounts as any)[1] ?? 0;
  const count2 = (tabCounts as any)[2] ?? 0;
  const count3 = (tabCounts as any)[3] ?? 0;

  const tabLabel = (text: string, count: number, showBadge: boolean = true) => {
    if (!showBadge) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0, width: '100%' }}>
          <Typography component="span" noWrap sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {text}
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0, width: '100%' }}>
        <Typography
          component="span"
          noWrap
          sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}
        >
          {text}
        </Typography>
        <Badge
          badgeContent={count}
          color={count === 0 ? 'default' : 'primary'}
          sx={{
            '& .MuiBadge-badge': {
              position: 'static',
              transform: 'none',
              marginLeft: '8px',
            },
          }}
        />
      </Box>
    );
  };

  const empty = useMemo(() => !loading && filteredOrders.length === 0, [loading, filteredOrders.length]);

  const handleTakeOrder = async (orderId: string) => {
    if (!orderId || !role || role !== 'DRIVER') return;
    if (takingOrderId) return;
    setTakingOrderId(orderId);
    setError(null);
    try {
      const res = await api.post('/driver/orders/' + orderId + '/take', {});
      if (!res.ok) throw new Error(res.error.message);

      // Обновим список, чтобы заказ ушел из "Новых".
      const nextRes = await api.get<Order[]>('/driver/orders');
      if (!nextRes.ok) throw new Error(nextRes.error.message);
      setOrders(nextRes.data as unknown as Order[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось взять заказ');
    } finally {
      setTakingOrderId(null);
    }
  };

  // Кнопка "Новый заказ" теперь вынесена во Floating Action Button ниже справа.
  // (Из шапки убираем, чтобы верстка была единообразной.)

  const title =
    role === 'DRIVER' ? 'Водитель: мои заказы' : role === 'ADMIN' ? 'Админка: все заказы' : 'Мои заказы';

  const tabDefs =
    role === 'DRIVER'
      ? [
          { value: 0, label: tabLabel('Новые', count0) },
          { value: 1, label: tabLabel('В работе', count1) },
          { value: 2, label: tabLabel('Завершенные', count2, false) },
        ]
      : role === 'ADMIN'
        ? [
            { value: 0, label: tabLabel('Все', count0) },
            { value: 1, label: tabLabel('Новые', count1) },
            { value: 2, label: tabLabel('В работе', count2) },
            { value: 3, label: tabLabel('Завершенные', count3, false) },
          ]
        : [
            { value: 0, label: tabLabel('Новые', count0) },
            { value: 1, label: tabLabel('Завершенные', count1, false) },
          ];

  return (
    <>
      <ScreenHeader
        title={title}
        showUserAvatar
      />

      {role === 'CLIENT' ? (
        <Fab
          variant="extended"
          color="primary"
          aria-label="Новый заказ"
          onClick={() => navigate('/orders/new')}
          sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: (t) => t.zIndex.speedDial }}
        >
          <AddIcon sx={{ mr: 1 }} />
          Новый заказ
        </Fab>
      ) : null}

      <Box sx={{ px: 2, pb: 12 }}>
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
            {tabDefs.map((t) => (
              <Tab key={t.value} value={t.value} label={t.label} sx={{ minWidth: 0 }} />
            ))}
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
              У вас пока нет заказов
            </Typography>
            <Typography color="text.secondary">Создайте первый заказ доставки</Typography>
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
                      <Typography color="text.secondary">
                        {order.address || 'Адрес не указан'}
                      </Typography>
                      <Typography color="text.secondary">
                        <b>{totalPriceText}</b>
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                      {role === 'DRIVER' && order.driverId == null && order.status === 'NEW' ? (
                        <Button
                          variant="contained"
                          size="small"
                          disabled={takingOrderId === order.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleTakeOrder(order.id);
                          }}
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
