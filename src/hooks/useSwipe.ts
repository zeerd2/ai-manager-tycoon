import { useRef, useCallback, useEffect } from 'react';

export interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  velocity: number;
  isSwiping: boolean;
}

export interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

interface UseSwipeOptions {
  onSwipeLeft?: (state: SwipeState) => void;
  onSwipeRight?: (state: SwipeState) => void;
  onSwipeUp?: (state: SwipeState) => void;
  onSwipeDown?: (state: SwipeState) => void;
  onSwipeMove?: (state: SwipeState) => void;
  onSwipeEnd?: (state: SwipeState) => void;
  threshold?: number;
  velocityThreshold?: number;
  direction?: 'horizontal' | 'vertical' | 'both';
}

const DEFAULT_THRESHOLD = 50;
const DEFAULT_VELOCITY = 0.3;

export function useSwipe(options: UseSwipeOptions = {}): { ref: React.RefObject<HTMLElement | null>; handlers: SwipeHandlers } {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipeMove,
    onSwipeEnd,
    threshold = DEFAULT_THRESHOLD,
    velocityThreshold = DEFAULT_VELOCITY,
    direction = 'both',
  } = options;

  const ref = useRef<HTMLElement | null>(null);
  const stateRef = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    direction: null,
    velocity: 0,
    isSwiping: false,
  });
  const startTimeRef = useRef(0);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    stateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      direction: null,
      velocity: 0,
      isSwiping: true,
    };
    startTimeRef.current = Date.now();
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    const state = stateRef.current;
    if (!state.isSwiping) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - state.startX;
    const deltaY = touch.clientY - state.startY;

    let swipeDirection: SwipeState['direction'] = null;
    if (direction === 'horizontal' || direction === 'both') {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        swipeDirection = deltaX > 0 ? 'right' : 'left';
      }
    }
    if (direction === 'vertical' || direction === 'both') {
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        swipeDirection = deltaY > 0 ? 'down' : 'up';
      }
    }

    const elapsed = Date.now() - startTimeRef.current;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = elapsed > 0 ? distance / elapsed : 0;

    stateRef.current = {
      ...state,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX,
      deltaY,
      direction: swipeDirection,
      velocity,
    };

    onSwipeMove?.(stateRef.current);
  }, [direction, onSwipeMove]);

  const onTouchEnd = useCallback(() => {
    const state = stateRef.current;
    if (!state.isSwiping) return;

    const elapsed = Date.now() - startTimeRef.current;
    const distance = Math.sqrt(state.deltaX * state.deltaX + state.deltaY * state.deltaY);
    const velocity = elapsed > 0 ? distance / elapsed : 0;

    const finalState: SwipeState = {
      ...state,
      velocity,
      isSwiping: false,
    };

    onSwipeEnd?.(finalState);

    const meetsThreshold = distance >= threshold;
    const meetsVelocity = velocity >= velocityThreshold;

    if (meetsThreshold || meetsVelocity) {
      if (state.direction === 'left') onSwipeLeft?.(finalState);
      if (state.direction === 'right') onSwipeRight?.(finalState);
      if (state.direction === 'up') onSwipeUp?.(finalState);
      if (state.direction === 'down') onSwipeDown?.(finalState);
    }

    stateRef.current = { ...stateRef.current, isSwiping: false };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onSwipeEnd, threshold, velocityThreshold]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  return { ref, handlers: { onTouchStart, onTouchMove, onTouchEnd } };
}
