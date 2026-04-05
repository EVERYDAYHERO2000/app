import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, MenuItem, Paper, Slider, Stack, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { ScreenHeader } from '../../shared/ScreenHeader';
import { api } from '../../shared/api/client';
import type { AdminCategory } from './materialsTypes';

type FlatPrice = {
  id: string;
  materialId: string;
  name: string;
  description?: string | null;
  basePricePerUnit?: string | number | null;
  markupPercent?: number | null;
  pricePerUnit: string | number;
};

export function AdminPriceFormScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isCreate = id === 'new';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [existing, setExisting] = useState<FlatPrice | null>(null);

  const [materialId, setMaterialId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [markupPercent, setMarkupPercent] = useState<number>(0);

  const finalPrice = useMemo(() => basePrice * (1 + markupPercent / 100), [basePrice, markupPercent]);
  const markupPrice = useMemo(() => basePrice * (markupPercent / 100), [basePrice, markupPercent]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<AdminCategory[]>('/admin/materials');
        if (!res.ok) throw new Error(res.error.message);
        const list = res.data as unknown as AdminCategory[];
        if (!cancelled) setCategories(list);

        const prices = list.flatMap((c) => c.submaterials.map((s) => ({ ...s, materialId: c.id })));
        if (isCreate) {
          if (!cancelled) {
            setMaterialId(list[0]?.id ?? '');
          }
        } else {
          const found = prices.find((p) => p.id === id);
          if (!found) throw new Error('Позиция цены не найдена');
          if (!cancelled) {
            setExisting(found);
            setMaterialId(found.materialId);
            setName(found.name);
            setDescription(found.description ?? '');
            setBasePrice(Number(found.basePricePerUnit ?? found.pricePerUnit ?? 0));
            setMarkupPercent(Number(found.markupPercent ?? 0));
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const onSave = async () => {
    if (!materialId || !name.trim()) return;

    if (isCreate) {
      const res = await api.post(`/admin/materials/${materialId}/submaterials`, {
        name: name.trim(),
        description: description.trim() || undefined,
        basePricePerUnit: basePrice,
        markupPercent,
        currency: 'RUB',
        isActive: true,
        sortOrder: 1,
      });
      if (!res.ok) {
        alert(res.error.message);
        return;
      }
    } else if (existing) {
      const res = await api.patch(`/admin/submaterials/${existing.id}`, {
        name: name.trim(),
        description: description.trim() || undefined,
        basePricePerUnit: basePrice,
        markupPercent,
      });
      if (!res.ok) {
        alert(res.error.message);
        return;
      }
    }
    navigate('/admin/materials');
  };

  const onDelete = async () => {
    if (!existing) return;
    const confirmed = window.confirm('Удалить позицию цены?');
    if (!confirmed) return;
    const res = await api.delete(`/admin/submaterials/${existing.id}`);
    if (!res.ok) {
      alert(res.error.message);
      return;
    }
    navigate('/admin/materials');
  };

  return (
    <>
      <ScreenHeader
        title={isCreate ? 'Новая цена' : 'Редактирование цены'}
        leftAction={{ label: 'Назад', onClick: () => navigate('/admin/materials') }}
      />
      <Box sx={{ p: 2 }}>
        {loading ? (
          <Typography color="text.secondary">Загрузка...</Typography>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
              <TextField
                select
                label="Категория"
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                fullWidth
              >
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField label="Название позиции" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
              <TextField
                label="Описание"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
              <TextField
                label="Базовая цена за м3"
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                fullWidth
              />

              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Наценка: {markupPercent}%
                </Typography>
                <Slider
                  value={markupPercent}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(_e, v) => setMarkupPercent(Number(v))}
                  sx={{ mt: 1 }}
                />
              </Box>

              <Typography color="text.secondary">Цена наценки: {markupPrice.toLocaleString('ru-RU')} ₽</Typography>
              <Typography fontWeight={700}>Итоговая цена: {finalPrice.toLocaleString('ru-RU')} ₽</Typography>

              <Button variant="contained" onClick={() => void onSave()}>
                Сохранить
              </Button>
              {!isCreate ? (
                <Button color="error" onClick={() => void onDelete()}>
                  Удалить
                </Button>
              ) : null}
            </Stack>
          </Paper>
        )}
      </Box>
    </>
  );
}

