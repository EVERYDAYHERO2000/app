const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Простая заглушка fetch для локальной разработки/тестирования.
 * Включается через VITE_API_MOCK=true.
 */
type MockMaterialSub = {
  id: string;
  name: string;
  pricePerUnit: string;
  currency: string;
  isActive: boolean;
  sortOrder: number;
};

type MockMaterial = {
  id: string;
  name: string;
  slug: string;
  unit: string;
  isActive: boolean;
  sortOrder: number;
  submaterials: MockMaterialSub[];
};

type MockOrder = {
  id: string;
  clientId: string;
  driverId: string | null;
  material: string;
  materialSubtype?: string | null;
  materialNameSnapshot?: string | null;
  submaterialNameSnapshot?: string | null;
  volume: number;
  pricePerUnit?: string | null;
  totalPrice?: string | null;
  deliveryDate: string;
  address: string;
  coordinates?: string | null;
  phone: string;
  comment?: string | null;
  status: 'NEW' | 'ACCEPTED' | 'CONFIRMED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
};

const materialsMock: MockMaterial[] = [
  {
    id: 'mat-sand',
    name: 'Песок',
    slug: 'sand',
    unit: 'm3',
    isActive: true,
    sortOrder: 10,
    submaterials: [
      {
        id: 'sub-1',
        name: 'Песок карьерный',
        pricePerUnit: '900.00',
        currency: 'RUB',
        isActive: true,
        sortOrder: 1,
      },
    ],
  },
  {
    id: 'mat-gravel',
    name: 'Щебень',
    slug: 'gravel',
    unit: 'm3',
    isActive: true,
    sortOrder: 20,
    submaterials: [
      {
        id: 'sub-2',
        name: 'Щебень гранитный',
        pricePerUnit: '4700.00',
        currency: 'RUB',
        isActive: true,
        sortOrder: 4,
      },
    ],
  },
  {
    id: 'mat-asphalt',
    name: 'Асфальт',
    slug: 'asphalt',
    unit: 'm3',
    isActive: true,
    sortOrder: 30,
    submaterials: [
      {
        id: 'sub-3',
        name: 'Асфальтовая крошка',
        pricePerUnit: '2200.00',
        currency: 'RUB',
        isActive: true,
        sortOrder: 1,
      },
    ],
  },
];

let ordersMock: MockOrder[] = [
  {
    id: 'order-1',
    clientId: 'client-1',
    driverId: 'driver-1',
    material: 'sand',
    materialSubtype: 'Песок карьерный',
    materialNameSnapshot: 'Песок',
    submaterialNameSnapshot: 'Песок карьерный',
    volume: 20,
    pricePerUnit: '900.00',
    totalPrice: '18000.00',
    deliveryDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    address: 'Москва, пример улицы, д. 1',
    coordinates: '55.751574,37.573856',
    phone: '+79990000001',
    comment: 'Позвонить за час',
    status: 'CONFIRMED',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
];

let nextOrderNum = 2;

export async function mockFetch(input: RequestInfo | URL, init?: RequestInit) {
  // Vite/React тесты и рантайм будут передавать разные формы input, нормализуем.
  const url = typeof input === 'string' ? input : input.toString();
  const path = url.replace(/^https?:\/\/[^/]+/, '');
  const method = (init?.method ?? 'GET').toUpperCase();

  // Чуть-чуть задержки, чтобы поведение было ближе к реальному.
  await sleep(50);

  if (path === '/api/materials' && method === 'GET') {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        ok: true,
        data: [
          ...materialsMock,
        ],
      }),
    } as any;
  }

  if (path === '/api/orders/my' && method === 'GET') {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        ok: true,
        data: ordersMock.filter((o) => o.clientId === 'client-1'),
      }),
    } as any;
  }

  if (path === '/api/admin/orders' && method === 'GET') {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        ok: true,
        data: ordersMock,
      }),
    } as any;
  }

  if (path === '/api/admin/drivers' && method === 'GET') {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
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
      }),
    } as any;
  }

  if (path === '/api/admin/users' && method === 'GET') {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        ok: true,
        data: [
          {
            id: 'client-1',
            name: 'Клиент',
            phone: '+79990000001',
            email: 'client@example.com',
          },
        ],
      }),
    } as any;
  }

  if (path === '/api/driver/orders' && method === 'GET') {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        ok: true,
        data: ordersMock.filter(
          (o) =>
            (o.driverId === 'driver-1' && ['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS'].includes(o.status)) ||
            (o.driverId === null && o.status === 'NEW')
        ),
      }),
    } as any;
  }

  if (path.startsWith('/api/driver/orders/') && path.endsWith('/take') && method === 'POST') {
    const id = path.replace(/^\/api\/driver\/orders\//, '').replace(/\/take$/, '');
    const order = ordersMock.find((o) => o.id === id);
    if (!order) {
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ ok: false, error: { code: 'NOT_FOUND', message: 'Order not found' } }),
      } as any;
    }
    if (order.driverId !== null) {
      return {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({
          ok: false,
          error: { code: 'FORBIDDEN', message: 'Заказ уже взят другим водителем' },
        }),
      } as any;
    }
    if (order.status !== 'NEW') {
      return {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({
          ok: false,
          error: { code: 'FORBIDDEN', message: 'Этот заказ нельзя взять сейчас' },
        }),
      } as any;
    }

    order.driverId = 'driver-1';
    order.status = 'ACCEPTED';

    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ ok: true, data: order }),
    } as any;
  }

  if (path.startsWith('/api/orders/') && method === 'GET') {
    const withoutPrefix = path.replace(/^\/api\/orders\//, '');
    if (withoutPrefix.endsWith('/status-check')) {
      const id = withoutPrefix.replace(/\/status-check$/, '');
      const order = ordersMock.find((o) => o.id === id);
      if (!order) {
        return {
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({ ok: false, error: { code: 'NOT_FOUND', message: 'Order not found' } }),
        } as any;
      }

      const terminal = order.status === 'COMPLETED' || order.status === 'REJECTED';
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          ok: true,
          data: {
            id: order.id,
            status: order.status,
            isCompleted: terminal,
            shouldContinuePolling: !terminal,
          },
        }),
      } as any;
    }

    if (!withoutPrefix.includes('/')) {
      const id = withoutPrefix;
      const order = ordersMock.find((o) => o.id === id);
      if (!order) {
        return {
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({ ok: false, error: { code: 'NOT_FOUND', message: 'Order not found' } }),
        } as any;
      }

      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          ok: true,
          data: {
            ...order,
            timeline: [],
            driver: order.driverId
              ? { id: order.driverId, name: 'Водитель' }
              : null,
          },
        }),
      } as any;
    }
  }

  if (path === '/api/orders' && method === 'POST') {
    const body = init?.body ? JSON.parse(String(init.body)) : {};

    const createdId = `order-${nextOrderNum++}`;
    const now = new Date().toISOString();

    const material: string = body.material;
    const materialNameSnapshot: string | null = body.materialNameSnapshot ?? null;
    const materialSubtype: string | null = body.materialSubtype ?? null;
    const submaterialNameSnapshot: string | null = body.submaterialNameSnapshot ?? null;
    const volume: number = Number(body.volume ?? 0);
    const pricePerUnit: number | null = body.pricePerUnit != null ? Number(body.pricePerUnit) : null;
    const totalPrice: number | null = body.totalPrice != null ? Number(body.totalPrice) : null;
    const deliveryDate: string = body.deliveryDate ? String(body.deliveryDate) : now;
    const address: string = String(body.address ?? '');
    const coordinates: string | null =
      body.coordinates && typeof body.coordinates === 'object' && 'lat' in body.coordinates && 'lng' in body.coordinates
        ? `${body.coordinates.lat},${body.coordinates.lng}`
        : body.coordinates
          ? String(body.coordinates)
          : null;
    const phone: string = String(body.phone ?? '');
    const comment: string | null = body.comment ?? null;

    const newOrder: MockOrder = {
      id: createdId,
      clientId: 'client-1',
      driverId: null,
      material,
      materialSubtype,
      materialNameSnapshot,
      submaterialNameSnapshot,
      volume,
      pricePerUnit: pricePerUnit != null ? pricePerUnit.toFixed(2) : null,
      totalPrice: totalPrice != null ? totalPrice.toFixed(2) : null,
      deliveryDate,
      address,
      coordinates,
      phone,
      comment,
      status: 'NEW',
      createdAt: now,
    };

    ordersMock = [newOrder, ...ordersMock];

    return {
      ok: true,
      status: 201,
      statusText: 'Created',
      json: async () => ({
        ok: true,
        data: {
          id: createdId,
          status: 'NEW',
          createdAt: now,
        },
      }),
    } as any;
  }

  return {
    ok: false,
    status: 404,
    statusText: 'Not Found',
    json: async () => ({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Mock endpoint not implemented' },
    }),
  } as any;
}

