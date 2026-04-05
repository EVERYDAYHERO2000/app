import { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography, Tabs, Tab, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../../shared/ScreenHeader';
import { api } from '../../shared/api/client';
import type { AdminCategory } from './materialsTypes';

export function AdminMaterialsScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);

  const fetchMaterials = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<AdminCategory[]>('/admin/materials');
      if (!res.ok) throw new Error(res.error.message);
      setCategories(res.data as unknown as AdminCategory[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMaterials();
  }, []);

  const prices = useMemo(
    () => categories.flatMap((c) => c.submaterials.map((s) => ({ ...s, category: c }))),
    [categories]
  );

  return (
    <>
      <ScreenHeader title="Админка: материалы и цены" showUserAvatar />

      <Box sx={{ p: 2 }}>
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
          <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="fullWidth">
            <Tab label="Категории" />
            <Tab label="Цены" />
          </Tabs>
        </Box>

        {loading ? (
          <Typography color="text.secondary">Загрузка...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : tab === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {categories.map((c, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === categories.length - 1;
              return (
                <Paper
                  key={c.id}
                  onClick={() => navigate(`/admin/materials/categories/${c.id}`)}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
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
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    {c.name}
                  </Typography>
                  <Typography color="text.secondary">Картинка: {c.imageKey ?? c.slug}</Typography>
                </Paper>
              );
            })}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {prices.map((p, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === prices.length - 1;
              return (
                <Paper
                  key={p.id}
                  onClick={() => navigate(`/admin/materials/prices/${p.id}`)}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
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
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    {p.name}
                  </Typography>
                  <Typography color="text.secondary">Категория: {p.category.name}</Typography>
                  <Typography color="text.secondary">
                    База: {Number(p.basePricePerUnit ?? p.pricePerUnit).toLocaleString('ru-RU')} ₽, наценка:{' '}
                    {Number(p.markupPercent ?? 0)}%
                  </Typography>
                  <Typography color="text.secondary">
                    Итого: <b>{Number(p.pricePerUnit).toLocaleString('ru-RU')} ₽</b>
                  </Typography>
                </Paper>
              );
            })}
          </Box>
        )}

        <Fab
          color="primary"
          aria-label={tab === 0 ? 'Добавить категорию' : 'Добавить цену'}
          onClick={() => navigate(tab === 0 ? '/admin/materials/categories/new' : '/admin/materials/prices/new')}
          sx={{ position: 'fixed', right: 24, bottom: 24 }}
        >
          <AddIcon />
        </Fab>
      </Box>
    </>
  );
}
