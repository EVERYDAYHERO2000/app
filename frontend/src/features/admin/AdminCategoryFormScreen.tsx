import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { ScreenHeader } from '../../shared/ScreenHeader';
import { api } from '../../shared/api/client';
import { IMAGE_OPTIONS, slugify, type AdminCategory } from './materialsTypes';

export function AdminCategoryFormScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isCreate = id === 'new';
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [imageKey, setImageKey] = useState('sand');
  const [existing, setExisting] = useState<AdminCategory | null>(null);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => (isCreate ? 'Новая категория' : 'Редактирование категории'), [isCreate]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<AdminCategory[]>('/admin/materials');
        if (!res.ok) throw new Error(res.error.message);
        const list = res.data as unknown as AdminCategory[];
        if (isCreate) {
          if (!cancelled) {
            setName('');
            setImageKey('sand');
          }
        } else {
          const found = list.find((m) => m.id === id);
          if (!found) throw new Error('Категория не найдена');
          if (!cancelled) {
            setExisting(found);
            setName(found.name);
            setImageKey(found.imageKey ?? 'sand');
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
    const trimmed = name.trim();
    if (!trimmed) return;

    if (isCreate) {
      const payload = {
        name: trimmed,
        slug: slugify(trimmed),
        imageKey,
        unit: 'm3',
        isActive: true,
        sortOrder: 1,
      };
      const res = await api.post('/admin/materials', payload);
      if (!res.ok) {
        alert(res.error.message);
        return;
      }
    } else if (existing) {
      const res = await api.patch(`/admin/materials/${existing.id}`, {
        name: trimmed,
        imageKey,
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
    const confirmed = window.confirm('Удалить категорию?');
    if (!confirmed) return;
    const res = await api.delete(`/admin/materials/${existing.id}`);
    if (!res.ok) {
      alert(res.error.message);
      return;
    }
    navigate('/admin/materials');
  };

  return (
    <>
      <ScreenHeader title={title} leftAction={{ label: 'Назад', onClick: () => navigate('/admin/materials') }} />
      <Box sx={{ p: 2 }}>
        {loading ? (
          <Typography color="text.secondary">Загрузка...</Typography>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
              <TextField label="Название категории" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
              <TextField select label="Картинка" value={imageKey} onChange={(e) => setImageKey(e.target.value)} fullWidth>
                {IMAGE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
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

