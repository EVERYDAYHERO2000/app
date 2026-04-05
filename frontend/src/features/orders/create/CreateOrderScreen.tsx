import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Slider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import { api } from '../../../shared/api/client';
import MapIcon from '@mui/icons-material/Map';
import CheckIcon from '@mui/icons-material/Check';
import { ScreenHeader } from '../../../shared/ScreenHeader';
import { useMe } from '../../../shared/useMe';
import sandImg from '@/assets/materials/sand.png';
import gravelImg from '@/assets/materials/gravel.png';
import asphaltImg from '@/assets/materials/asphalt.png';

declare global {
  interface Window {
    ymaps?: any;
  }
}

const materialAssets: Record<string, { img: string; title: string }> = {
  sand: { img: sandImg, title: 'Песок' },
  gravel: { img: gravelImg, title: 'Щебень' },
  asphalt: { img: asphaltImg, title: 'Асфальт' },
};

export function CreateOrderScreen() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement | null>(null);
  const { me, loading: meLoading } = useMe();

  type Submaterial = {
    id: string;
    name: string;
    pricePerUnit: string | number;
    currency?: string;
    isActive: boolean;
    sortOrder: number;
  };

  type Material = {
    id: string;
    name: string;
    slug: string;
    imageKey?: string | null;
    unit: string;
    isActive: boolean;
    sortOrder: number;
    submaterials: Submaterial[];
  };

  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialSlug, setSelectedMaterialSlug] = useState<string>('');
  const [selectedSubmaterialId, setSelectedSubmaterialId] = useState<string>('');

  const [volume, setVolume] = useState<number>(20);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [comment, setComment] = useState<string>('');

  const [mapOpen, setMapOpen] = useState(false);
  const [pickedAddress, setPickedAddress] = useState<string>('');
  const [pickedCoordinates, setPickedCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Yandex map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const ymapsRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const placemarkRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<{ id: string; name: string; slug: string; unit: string; isActive: boolean; sortOrder: number; submaterials: Submaterial[] }[]>(
          '/materials'
        );
        if (!mounted) return;
        if (!res.ok) throw new Error(res.error.message);
        const list = res.data as unknown as Material[];
        setMaterials(list);
        if (list.length > 0) {
          setSelectedMaterialSlug((prev) => prev || list[0].slug);
        }
      } catch (e) {
        // В реальном приложении показывать Snackbar/Alert
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // Устанавливаем минимальную дату доставки: завтра
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    setDeliveryDate(tomorrow.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    // Доступ к созданию заказов только для клиента.
    if (meLoading) return;
    if (me?.role && me.role !== 'CLIENT') {
      navigate('/orders');
    }
  }, [me?.role, meLoading, navigate]);

  const selectedMaterial = useMemo(
    () => materials.find((m) => m.slug === selectedMaterialSlug) ?? null,
    [materials, selectedMaterialSlug]
  );

  const shouldHideSubtype = useMemo(() => {
    if (!selectedMaterial) return true;
    return (selectedMaterial.submaterials?.length ?? 0) === 0;
  }, [selectedMaterial]);

  useEffect(() => {
    if (!selectedMaterial) return;
    const subs = selectedMaterial.submaterials ?? [];
    if (subs.length === 0) {
      setSelectedSubmaterialId('');
      return;
    }
    // Если подтип скрыт, всё равно фиксируем первый подматериал для расчета цены/снапшота
    const effectiveId = subs[0].id;
    setSelectedSubmaterialId(effectiveId);
  }, [selectedMaterial]);

  const effectiveSubmaterial = useMemo(() => {
    if (!selectedMaterial) return null;
    if (selectedMaterial.submaterials.length === 0) return null;
    if (shouldHideSubtype) return selectedMaterial.submaterials[0];
    return selectedMaterial.submaterials.find((s) => s.id === selectedSubmaterialId) ?? selectedMaterial.submaterials[0];
  }, [selectedMaterial, selectedSubmaterialId, shouldHideSubtype]);

  const pricePerUnit = useMemo(() => {
    const p = effectiveSubmaterial?.pricePerUnit ?? 0;
    return Number(p);
  }, [effectiveSubmaterial]);

  const totalPrice = useMemo(() => {
    return pricePerUnit * volume;
  }, [pricePerUnit, volume]);

  const truckText = useMemo(() => {
    const trucks = Math.ceil(volume / 20);
    if (trucks === 1) return `(${trucks} камаз)`;
    if (trucks === 2 || trucks === 3 || trucks === 4) return `(${trucks} камаза)`;
    return `(${trucks} камазов)`;
  }, [volume]);

  async function loadYandexMaps(apiKey: string) {
    if (window.ymaps) return window.ymaps;
    await new Promise<void>((resolve, reject) => {
      const scriptId = 'yandex-maps-script';
      if (document.getElementById(scriptId)) {
        // Подождем, пока ymaps догрузится
        const check = () => {
          if (window.ymaps) resolve();
          else setTimeout(check, 50);
        };
        check();
        return;
      }
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Не удалось загрузить Yandex Maps API'));
      document.head.appendChild(script);
    });
    return window.ymaps;
  }

  async function openMap() {
    setMapOpen(true);
    setMapError(null);
    setPickedAddress('');
    setPickedCoordinates(null);

    const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined;
    if (!apiKey) {
      setMapError('Карта недоступна: не задан VITE_YANDEX_MAPS_API_KEY. Введите адрес вручную.');
      return;
    }

    try {
      const ymaps = await loadYandexMaps(apiKey);
      ymapsRef.current = ymaps;

      // Если карта уже инициализирована — просто подгоним размер
      if (mapRef.current && mapContainerRef.current) {
        mapRef.current.container.fitToViewport();
        return;
      }

      ymaps.ready(() => {
        if (!mapContainerRef.current) return;
        mapRef.current = new ymaps.Map(mapContainerRef.current, {
          center: [55.751574, 37.573856],
          zoom: 10,
          controls: ['zoomControl', 'geolocationControl'],
        });

        mapRef.current.events.add('click', async (e: any) => {
          const coords = e.get('coords'); // [lat,lng]
          const lat = Number(coords[0]);
          const lng = Number(coords[1]);

          // #region agent log (map click start)
          fetch('http://127.0.0.1:7476/ingest/73168748-0b97-4f4d-98cf-730f58805a63', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Debug-Session-Id': '66896f',
            },
            body: JSON.stringify({
              sessionId: '66896f',
              runId: 'initial',
              hypothesisId: 'H1',
              location: 'CreateOrderScreen.tsx:MAP_CLICK_START',
              message: 'Map click coords captured',
              data: { lat, lng },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          // #endregion

          setPickedCoordinates({ lat, lng });

          if (placemarkRef.current) {
            mapRef.current.geoObjects.remove(placemarkRef.current);
          }
          placemarkRef.current = new ymaps.Placemark(
            coords,
            { balloonContent: 'Место доставки' },
            { preset: 'islands#redDotIcon' }
          );
          mapRef.current.geoObjects.add(placemarkRef.current);
          mapRef.current.panTo(coords);

          try {
            const res = await ymaps.geocode(coords);
            const firstGeoObject = res.geoObjects.get(0);
            const foundAddress = firstGeoObject ? firstGeoObject.getAddressLine() : 'Адрес не найден';

            // #region agent log (geocode resolved)
            fetch('http://127.0.0.1:7476/ingest/73168748-0b97-4f4d-98cf-730f58805a63', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Debug-Session-Id': '66896f',
              },
              body: JSON.stringify({
                sessionId: '66896f',
                runId: 'initial',
                hypothesisId: 'H2',
                location: 'CreateOrderScreen.tsx:GEOCODE_RESOLVED',
                message: 'Reverse geocode resolved',
                data: { foundAddress },
                timestamp: Date.now(),
              }),
            }).catch(() => {});
            // #endregion

            setPickedAddress(foundAddress);
          } catch {
            // #region agent log (geocode failed)
            fetch('http://127.0.0.1:7476/ingest/73168748-0b97-4f4d-98cf-730f58805a63', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Debug-Session-Id': '66896f',
              },
              body: JSON.stringify({
                sessionId: '66896f',
                runId: 'initial',
                hypothesisId: 'H2',
                location: 'CreateOrderScreen.tsx:GEOCODE_FAILED',
                message: 'Reverse geocode failed',
                data: {},
                timestamp: Date.now(),
              }),
            }).catch(() => {});
            // #endregion

            setPickedAddress('');
          }
        });
      });
    } catch (e) {
      setMapError(e instanceof Error ? e.message : String(e));
    }
  }

  function closeMap() {
    setMapOpen(false);
  }

  function applyMapSelection() {
    // #region agent log (apply selection)
    fetch('http://127.0.0.1:7476/ingest/73168748-0b97-4f4d-98cf-730f58805a63', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '66896f',
      },
      body: JSON.stringify({
        sessionId: '66896f',
        runId: 'initial',
        hypothesisId: 'H1',
        location: 'CreateOrderScreen.tsx:APPLY_SELECTION',
        message: 'Apply map selection pressed',
        data: {
          hasPickedAddress: Boolean(pickedAddress),
          pickedAddress,
          hasPickedCoordinates: Boolean(pickedCoordinates),
          pickedCoordinates,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (pickedAddress) setAddress(pickedAddress);
    if (pickedCoordinates) setCoordinates(pickedCoordinates);
    setMapOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedMaterial) {
      alert('Выберите материал');
      return;
    }
    if (!deliveryDate) {
      alert('Выберите дату доставки');
      return;
    }
    if (!address.trim()) {
      alert('Введите адрес доставки');
      return;
    }
    const phoneFromSettings = me?.phone ?? '';
    if (!phoneFromSettings.trim()) {
      alert('Укажите контактный телефон в настройках профиля');
      return;
    }
    if (!effectiveSubmaterial && !shouldHideSubtype) {
      alert('Выберите подтип материала');
      return;
    }
    // В MVP используем только дату доставки (время не выбираем).
    const deliveryIso = new Date(`${deliveryDate}T00:00:00`).toISOString();

    const payload = {
      material: selectedMaterial.slug,
      materialSubtype: shouldHideSubtype ? undefined : effectiveSubmaterial?.name,
      materialNameSnapshot: selectedMaterial.name,
      submaterialNameSnapshot: effectiveSubmaterial?.name,
      volume,
      deliveryDate: deliveryIso,
      address,
      coordinates: coordinates || undefined,
      phone: phoneFromSettings,
      comment: comment || undefined,
      pricePerUnit: pricePerUnit,
      totalPrice,
    };

    const res = await api.post<{ id: string; status: string; createdAt?: string }>(
      '/orders',
      payload
    );

    if (!res.ok) {
      alert(res.error.message);
      return;
    }
    navigate('/orders/created');
  }

  return (
    <>
      <ScreenHeader title="Новый заказ" leftAction={{ label: 'Назад', onClick: () => navigate('/orders') }} />

      <Box sx={{ pb: 'calc(152px + env(safe-area-inset-bottom, 0px))' }}>
      <Box sx={{ p: 3, mb: 2 }}>

        {loading ? (
          <Typography color="text.secondary">Загрузка материалов...</Typography>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: 1, pb: 1 }}>
                  {materials.map((m) => {
                    const active = m.slug === selectedMaterialSlug;
                    const asset = materialAssets[(m.imageKey ?? m.slug) as keyof typeof materialAssets];
                    return (
                      <Paper
                        key={m.id}
                        variant="outlined"
                        onClick={() => setSelectedMaterialSlug(m.slug)}
                        sx={{
                          flex: '0 0 auto',
                          width: 160,
                          p: 1,
                          cursor: 'pointer',
                          borderColor: active ? 'primary.main' : undefined,
                          backgroundColor: active ? 'rgba(25,118,210,0.06)' : undefined,
                        }}
                      >
                        <Box
                          component="img"
                          src={asset?.img}
                          alt={asset?.title ?? m.name}
                          sx={{
                            width: '100%',
                            height: 72,
                            objectFit: 'cover',
                            borderRadius: 1,
                            mb: 0.75,
                            display: 'block',
                            bgcolor: 'action.hover',
                          }}
                        />

                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography fontWeight={700} sx={{ fontSize: 13 }}>
                            {asset?.title ?? m.name}
                          </Typography>
                          {active ? <CheckIcon fontSize="small" color="primary" /> : null}
                        </Stack>
                      </Paper>
                    );
                  })}
                </Box>

              {!shouldHideSubtype ? (
                <FormControl fullWidth>
                  <InputLabel id="subtype-select-label">Подтип материала</InputLabel>
                  <Select
                    labelId="subtype-select-label"
                    value={selectedSubmaterialId}
                    label="Подтип материала"
                    onChange={(ev) => setSelectedSubmaterialId(String(ev.target.value))}
                  >
                    {(selectedMaterial?.submaterials ?? []).map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name} (цена: {Number(s.pricePerUnit).toLocaleString('ru-RU')} ₽)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                  <Typography color="text.secondary" fontSize={13}>
                    Подтип не требуется для {selectedMaterial?.name ?? 'материала'}
                  </Typography>
                </Paper>
              )}

              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Объем: {volume} м³{' '}
                  <Typography component="span" variant="body2" color="text.secondary">
                    {truckText}
                  </Typography>
                </Typography>
                <Slider
                  value={volume}
                  min={5}
                  max={100}
                  step={5}
                  onChange={(_e, v) => setVolume(Number(v))}
                  sx={{ mt: 1 }}
                />
              </Box>

              <Grid container spacing={0}>
                <Grid item xs={12}>
                  <TextField
                    label="Дата доставки"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
              </Grid>

              <TextField
                label="Место доставки (адрес)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                fullWidth
                required
                placeholder="Введите адрес"
              />

              <Button variant="outlined" onClick={openMap}>
                <MapIcon fontSize="small" style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Указать на карте
              </Button>

              {mapError ? (
                <Typography color="error" variant="body2">
                  {mapError}
                </Typography>
              ) : null}

              <TextField
                label="Комментарий"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder="Дополнительная информация о заказе"
              />
            </Stack>
          </form>
        )}
      </Box>

      {!loading && (meLoading || !me?.role || me.role === 'CLIENT') ? (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: (t) => t.zIndex.appBar - 1,
            px: 2,
            pt: 2,
            pb: `calc(12px + env(safe-area-inset-bottom, 0px))`,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={2}>
              <Typography color="text.secondary" variant="body2">
                Объём
              </Typography>
              <Typography fontWeight={700} textAlign="right">
                {volume} м³{' '}
                <Typography component="span" variant="body2" color="text.secondary" fontWeight={400}>
                  {truckText}
                </Typography>
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={2}>
              <Typography color="text.secondary" variant="body2">
                Итого
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                {totalPrice.toLocaleString('ru-RU')} ₽
              </Typography>
            </Stack>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={() => formRef.current?.requestSubmit()}
            >
              Создать
            </Button>
          </Stack>
        </Paper>
      ) : null}

      <Dialog open={mapOpen} onClose={closeMap} fullWidth maxWidth="md">
        <DialogTitle>Выберите место на карте</DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          {mapError ? (
            <Typography color="error" sx={{ mt: 2 }}>
              {mapError}
            </Typography>
          ) : (
            <Box>
              <Box
                ref={mapContainerRef}
                sx={{ width: '100%', height: 420, borderRadius: 2, overflow: 'hidden', mt: 1 }}
              />

              {pickedAddress ? (
                <Paper sx={{ p: 1.5, mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Адрес:
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {pickedAddress}
                  </Typography>
                </Paper>
              ) : null}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMap}>Отмена</Button>
          <Button variant="contained" onClick={applyMapSelection} disabled={!pickedCoordinates && !pickedAddress}>
            Применить
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </>
  );
}
