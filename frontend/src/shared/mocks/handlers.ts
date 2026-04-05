import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/materials', () => {
    return HttpResponse.json({
      ok: true,
      data: [
        {
          id: 'mat-sand',
          name: 'Песок',
          slug: 'sand',
          unit: 'm3',
          isActive: true,
          sortOrder: 10,
          submaterials: [
            { id: 'sub-1', name: 'Песок карьерный', pricePerUnit: '900.00', currency: 'RUB', isActive: true, sortOrder: 1 },
          ],
        },
      ],
    });
  }),

  http.get('/api/orders/my', () => {
    return HttpResponse.json({
      ok: true,
      data: [],
    });
  }),

  http.post('/api/orders', async () => {
    return HttpResponse.json(
      {
        ok: true,
        data: {
          id: 'order-1',
          status: 'NEW',
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  }),

  http.get('/api/me', () => {
    return HttpResponse.json({
      ok: true,
      data: {
        id: 'me-1',
        role: 'CLIENT',
        name: 'Тест Пользователь',
        phone: '+79990000000',
        email: 'test@example.com',
        carBrand: null,
        carPlateNumber: null,
      },
    });
  }),

  http.patch('/api/me', async ({ request }) => {
    const body: any = await request.json().catch(() => ({}));
    return HttpResponse.json({
      ok: true,
      data: {
        id: 'me-1',
        role: 'CLIENT',
        name: 'Тест Пользователь',
        phone: body.phone ?? '+79990000000',
        email: body.email ?? 'test@example.com',
        carBrand: body.carBrand ?? null,
        carPlateNumber: body.carPlateNumber ?? null,
      },
    });
  }),

  http.get('/api/admin/drivers', () => {
    return HttpResponse.json({
      ok: true,
      data: [
        {
          id: 'driver-1',
          name: 'Водитель',
          phone: '+79990000003',
          email: 'driver@example.com',
          carBrand: 'Toyota',
          carPlateNumber: 'A123BC',
        },
      ],
    });
  }),

  http.get('/api/admin/users', () => {
    return HttpResponse.json({
      ok: true,
      data: [
        {
          id: 'client-1',
          name: 'Клиент',
          phone: '+79990000001',
          email: 'client@example.com',
        },
      ],
    });
  }),

  http.get('/api/auth/yandex/callback', () => {
    return HttpResponse.json({ ok: false, error: { code: 'NOT_IMPLEMENTED', message: 'Mock callback' } }, { status: 501 });
  }),
];

