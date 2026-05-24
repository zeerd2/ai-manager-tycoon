import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

describe('ErrorBoundary', () => {
  it('getDerivedStateFromError returns state with hasError true and the error', () => {
    const error = new Error('Test error');
    const state = ErrorBoundary.getDerivedStateFromError(error);
    expect(state).toEqual({
      hasError: true,
      error,
    });
  });

  it('componentDidCatch logs the error to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const boundary = new ErrorBoundary({ children: null });
    const error = new Error('Test error');
    const info = { componentStack: 'App > Child' };

    boundary.componentDidCatch(error, info);

    expect(consoleSpy).toHaveBeenCalledWith('Uncaught error in component tree:', error, info);
    consoleSpy.mockRestore();
  });
});
