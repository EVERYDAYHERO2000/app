import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { api } from '../../shared/api/client';
import { DEV_USER_ID_STORAGE_KEY } from '../../shared/devUsers';

export function AuthScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const [password2, setPassword2] = useState('');
  const [role, setRole] = useState<'CLIENT' | 'DRIVER'>('CLIENT');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function redirectByRole() {
    const meRes = await api.get<{ id: string; role: string }>('/me');
    if (!meRes.ok) throw new Error(meRes.error.message);
    const role = meRes.data.role;
    if (role === 'ADMIN') return navigate('/orders');
    if (role === 'DRIVER') return navigate('/orders');
    return navigate('/orders');
  }

  return (
    <Box sx={{ p: 2, maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {mode === 'login' ? 'Вход' : 'Регистрация'}
        </Typography>

        <Tabs value={mode} onChange={(_e, v) => setMode(v)} sx={{ mb: 2 }}>
          <Tab value="login" label="Вход" />
          <Tab value="register" label="Регистрация" />
        </Tabs>

        {error ? (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        ) : null}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Логин"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            fullWidth
            required
          />

          {mode === 'register' ? (
            <>
              <TextField
                label="Пароль ещё раз"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                type="password"
                fullWidth
                required
              />

              <FormControl fullWidth>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'CLIENT' | 'DRIVER')}
                  displayEmpty
                >
                  <MenuItem value="CLIENT">Пользователь</MenuItem>
                  <MenuItem value="DRIVER">Водитель</MenuItem>
                </Select>
              </FormControl>
            </>
          ) : null}

          <Button
            variant="contained"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                if (!login.trim() || !password.trim()) {
                  setError('Заполните логин и пароль');
                  return;
                }

                if (mode === 'login') {
                  const res = await api.post('/auth/login', { login, password });
                  if (!res.ok) throw new Error(res.error.message);
                  window.localStorage.removeItem(DEV_USER_ID_STORAGE_KEY);
                  await redirectByRole();
                  return;
                }

                if (password !== password2) {
                  setError('Пароли не совпадают');
                  return;
                }

                const regRes = await api.post('/auth/register', { login, password, password2, role });
                if (!regRes.ok) throw new Error(regRes.error.message);

                // После регистрации сразу логиним.
                const loginRes = await api.post('/auth/login', { login, password });
                if (!loginRes.ok) throw new Error(loginRes.error.message);
                window.localStorage.removeItem(DEV_USER_ID_STORAGE_KEY);
                // После регистрации показываем дополнительный экран с контактами/данными водителя
                navigate('/profile');
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Ошибка входа');
              } finally {
                setLoading(false);
              }
            }}
          >
            {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
