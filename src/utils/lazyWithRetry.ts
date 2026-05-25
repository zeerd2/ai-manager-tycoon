import { lazy, type ComponentType } from 'react';

/**
 * A helper that wraps React.lazy to automatically retry imports on network failure.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retriesLeft = 2,
  interval = 1000
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    for (let i = 0; i <= retriesLeft; i++) {
      try {
        return await componentImport();
      } catch (error) {
        if (i === retriesLeft) throw error;
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }
    throw new Error('Failed to load component after retries');
  });
}
