import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';

/**
 * По умолчанию тесты используют простые моки `fetch` в самих тестах.
 * MSW (fetch-mocking на уровне сети) включается только если:
 *   VITEST_USE_MSW=true
 *
 * Это сделано, чтобы избежать проблем с полифилами в текущем Node окружении.
 */
const useMsw = (globalThis as any).process?.env?.VITEST_USE_MSW === 'true';

if (useMsw) {
  // Включать MSW только при необходимости и готовности окружения.
  const { server } = await import('./shared/mocks/server');
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}

