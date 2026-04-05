import { Box, Button, Paper, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../../../shared/ScreenHeader';

export function OrderCreatedScreen() {
  const navigate = useNavigate();

  return (
    <>
      <ScreenHeader title="Заказ создан" leftAction={{ label: 'К заказам', onClick: () => navigate('/orders') }} />

      <Box sx={{ p: 2 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Заказ создан
          </Typography>
          <Typography color="text.secondary">Ждите подтверждения заказа.</Typography>

          <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/orders')}>
            К списку заказов
          </Button>
        </Paper>
      </Box>
    </>
  );
}

