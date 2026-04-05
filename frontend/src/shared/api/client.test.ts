import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from './client';

describe('api client (fetch mocks)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const path = url.replace(/^https?:\/\/[^/]+/, '');

      if (path === '/api/materials') {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            ok: true,
            data: [
              {
                id: 'mat-sand',
                name: 'Песок',
                slug: 'sand',
                unit: 'm3',
                isActive: true,
                sortOrder: 10,
                submaterials: [],
              },
            ],
          }),
        } as any;
      }

      if (path === '/api/orders' && init?.method === 'POST') {
        return {
          ok: true,
          status: 201,
          statusText: 'Created',
          json: async () => ({
            ok: true,
            data: {
              id: 'order-1',
              status: 'NEW',
              createdAt: new Date().toISOString(),
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
          error: { code: 'NOT_FOUND', message: 'Not mocked' },
        }),
      } as any;
    }) as any;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('GET /materials should return mocked materials', async () => {
    const res = await api.get<{ id: string; slug: string }[]>('/materials');
    if (!res.ok) throw new Error(res.error.message);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].slug).toBe('sand');
  });

  it('POST /orders should return mocked created order', async () => {
    const res = await api.post<{ id: string; status: string }>(
      '/orders',
      {
        material: 'sand',
        materialSubtype: 'Песок карьерный',
        volume: 10,
        deliveryDate: '2026-03-25T10:00:00.000Z',
        address: 'Москва',
        coordinates: { lat: 55.75, lng: 37.57 },
        phone: '+79990000000',
        comment: 'Тест заказа',
      }
    );
    if (!res.ok) throw new Error(res.error.message);
    expect(typeof res.data.id).toBe('string');
    expect(res.data.status).toBe('NEW');
  });
});

