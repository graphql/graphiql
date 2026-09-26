import { expect, it, vi } from 'vitest';
import { createMonacoInitializer } from './monaco';

it('shares initialization between concurrent callers', async () => {
  const load = vi.fn(async () => ({}));
  const initialize = createMonacoInitializer(load);

  await Promise.all([initialize(), initialize()]);

  expect(load).toHaveBeenCalledOnce();
});

it('retries initialization after a failure', async () => {
  const error = new Error('Failed to load Monaco');
  const load = vi
    .fn<() => Promise<object>>()
    .mockRejectedValueOnce(error)
    .mockResolvedValueOnce({});
  const initialize = createMonacoInitializer(load);

  await expect(initialize()).rejects.toBe(error);
  await expect(initialize()).resolves.toEqual({});

  expect(load).toHaveBeenCalledTimes(2);
});
