import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';

// Assert the preload reached the Vitest worker before any test imports product code.
{
  const guarded = (process as NodeJS.Process & { plutusQaGuard?: boolean }).plutusQaGuard;
  if (!guarded) throw new Error('QA runtime guard missing in component worker');
  let denied = false;
  try { fs.readFileSync(path.join(process.cwd(), '.env.synthetic-probe')); }
  catch (error) { denied = error instanceof Error && error.message.includes('QA isolation: sensitive file'); }
  if (!denied) throw new Error('QA runtime guard probe failed in component worker');
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({ matches: false, media: query, onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }),
});

class ResizeObserverFixture {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverFixture;
