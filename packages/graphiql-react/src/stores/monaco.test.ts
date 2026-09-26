import { expect, it, vi } from 'vitest';
import { createMonacoInitializer } from './monaco';

it('shares initialization between concurrent callers', async () => {
  const load = vi.fn(async () => ({}));
  const initialize = createMonacoInitializer(load);

  await Promise.all([initialize(), initialize()]);

  expect(load).toHaveBeenCalledOnce();
});
