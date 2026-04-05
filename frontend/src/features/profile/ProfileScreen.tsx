import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Stack, CircularProgress } from '@mui/material';
import { api } from '../../shared/api/client';
import { useMe } from '../../shared/useMe';
import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../../shared/ScreenHeader';

export function ProfileScreen() {
  const navigate = useNavigate();
  const { me, loading, error: meError } = useMe();

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [carBrand, setCarBrand] = useState('');
  const [carPlateNumber, setCarPlateNumber] = useState('');

  useEffect(() => {
    if (!me) return;
    setPhone(me.phone ?? '');
    setEmail(me.email ?? '');
    setCarBrand(me.carBrand ?? '');
    setCarPlateNumber(me.carPlateNumber ?? '');
  }, [me]);

  const role = me?.role;
  const isDriver = role === 'DRIVER';
  const isClient = role === 'CLIENT';
  const isAdmin = role === 'ADMIN';

  const canSave = useMemo(() => {
    if (!me) return false;
    if (isAdmin) return false;
    if (!phone.trim()) return false;
    if (!email.trim()) return false;
    if (isDriver) {
      if (!carBrand.trim()) return false;
      if (!carPlateNumber.trim()) return false;
    }
    return true;
  }, [me, isAdmin, isDriver, phone, email, carBrand, carPlateNumber]);

  const handleSave = async () => {
    if (!me) return;
    if (!canSave) return;

    const payload: Record<string, string> = {
      phone,
      email,
    };
    if (isDriver) {
      payload.carBrand = carBrand;
      payload.carPlateNumber = carPlateNumber;
    }

    const res = await api.patch('/me', payload);
    if (!res.ok) {
      alert(res.error.message);
      return;
    }

    navigate('/orders');
  };

  return (
    <>
      <ScreenHeader
        title="Настройки"
        leftAction={{ label: 'Назад', onClick: () => navigate('/orders') }}
      />

      <Box sx={{ p: 2, maxWidth: 520, mx: 'auto', mt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : isAdmin ? (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Нет доступа
            </Typography>
            <Typography color="text.secondary">Администратор не имеет настроек.</Typography>
          </Paper>
        ) : (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Настройки профиля
            </Typography>
            {meError ? (
              <Typography color="error" sx={{ mb: 2 }}>
                {meError}
              </Typography>
            ) : null}

            <Stack spacing={2}>
              <TextField
                label="Контактный телефон"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Email для связи"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
              />

              {isDriver ? (
                <>
                  <TextField
                    label="Марка автомобиля"
                    value={carBrand}
                    onChange={(e) => setCarBrand(e.target.value)}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Номер автомобиля"
                    value={carPlateNumber}
                    onChange={(e) => setCarPlateNumber(e.target.value)}
                    fullWidth
                    required
                  />
                </>
              ) : null}

              <Button variant="contained" disabled={!canSave} onClick={() => void handleSave()}>
                Сохранить
              </Button>
            </Stack>

            {!isClient && !isDriver ? (
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                Роль пользователя не определена.
              </Typography>
            ) : null}
          </Paper>
        )}
      </Box>
    </>
  );
}
