import { ReactNode, useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import ListAltIcon from '@mui/icons-material/ListAlt';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useMe } from './useMe';
import { api } from './api/client';
import { useNavigate } from 'react-router-dom';
import { DEV_USER_ID_STORAGE_KEY } from './devUsers';

type HeaderAction = {
  label: string;
  onClick: () => void;
  startIcon?: ReactNode;
};

export function ScreenHeader(props: {
  title: string;
  leftAction?: HeaderAction;
  rightAction?: HeaderAction;
  showUserAvatar?: boolean;
}) {
  const { title, leftAction, rightAction, showUserAvatar = false } = props;
  const { me } = useMe();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <AppBar position="fixed" color="primary" elevation={0}>
        <Toolbar disableGutters sx={{ gap: 1, px: 2 }}>
          {/* Единый контейнер слева: иконка всегда занимает одно и то же место */}
          <Box sx={{ width: 40, flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>
            {showUserAvatar ? (
              <>
                <IconButton
                  size="large"
                  color="inherit"
                  aria-label={me?.name ? `Меню: ${me.name}` : 'Меню'}
                  onClick={() => setDrawerOpen(true)}
                  sx={{ ml: 0 }}
                >
                  <MenuIcon />
                </IconButton>

                <Drawer
                  anchor="left"
                  open={drawerOpen}
                  onClose={() => setDrawerOpen(false)}
                  ModalProps={{ keepMounted: true }}
                >
                  <Box sx={{ width: 280 }} role="presentation">
                    <Divider />
                    <List sx={{ '& .MuiListItemIcon-root': { minWidth: 36 } }}>
                      <ListItemButton
                        onClick={() => {
                          setDrawerOpen(false);
                          navigate('/orders');
                        }}
                      >
                        <ListItemIcon>
                          <ListAltIcon />
                        </ListItemIcon>
                        <ListItemText primary="Заказы" />
                      </ListItemButton>

                      {me?.role === 'ADMIN' ? (
                        <>
                          <ListItemButton
                            onClick={() => {
                              setDrawerOpen(false);
                              navigate('/admin/materials');
                            }}
                          >
                            <ListItemIcon>
                              <SettingsIcon />
                            </ListItemIcon>
                            <ListItemText primary="Цены" />
                          </ListItemButton>
                          <ListItemButton
                            onClick={() => {
                              setDrawerOpen(false);
                              navigate('/admin/drivers');
                            }}
                          >
                            <ListItemIcon>
                              <DirectionsCarIcon />
                            </ListItemIcon>
                            <ListItemText primary="Водители" />
                          </ListItemButton>
                          <ListItemButton
                            onClick={() => {
                              setDrawerOpen(false);
                              navigate('/admin/users');
                            }}
                          >
                            <ListItemIcon>
                              <PeopleIcon />
                            </ListItemIcon>
                            <ListItemText primary="Пользователи" />
                          </ListItemButton>
                        </>
                      ) : (
                        <ListItemButton
                          onClick={() => {
                            setDrawerOpen(false);
                            navigate('/profile');
                          }}
                        >
                          <ListItemIcon>
                            <SettingsIcon />
                          </ListItemIcon>
                          <ListItemText primary="Настройки" />
                        </ListItemButton>
                      )}

                      <ListItemButton
                        onClick={async () => {
                          setDrawerOpen(false);
                          // Очистим dev-флаг, если он был выставлен ранее.
                          window.localStorage.removeItem(DEV_USER_ID_STORAGE_KEY);
                          await api.post('/auth/logout', {});
                          navigate('/auth');
                        }}
                      >
                        <ListItemIcon>
                          <LogoutIcon />
                        </ListItemIcon>
                        <ListItemText primary="Выйти" />
                      </ListItemButton>
                    </List>
                  </Box>
                </Drawer>
              </>
            ) : leftAction ? (
              <IconButton
                size="large"
                color="inherit"
                aria-label={leftAction.label}
                onClick={leftAction.onClick}
                sx={{ ml: 0 }}
              >
                <ArrowBackIcon />
              </IconButton>
            ) : null}
          </Box>

          {/* Заголовок: фиксируем внутренние отступы (0 8px), чтобы не скакал */}
          <Box sx={{ flex: '1 1 auto', px: 1, display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                width: '100%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight: 700,
              }}
            >
              {title}
            </Typography>
          </Box>

          {/* Правая часть: кнопка (если есть), без фикса ширины */}
          <Box sx={{ flex: '0 0 auto', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            {rightAction ? (
              <Button color="inherit" onClick={rightAction.onClick} startIcon={rightAction.startIcon}>
                {rightAction.label}
              </Button>
            ) : null}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Spacer под фиксированный AppBar */}
      <Toolbar />
    </>
  );
}

