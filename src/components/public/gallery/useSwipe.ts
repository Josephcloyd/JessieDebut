"use client";

import { useRef, type TouchEvent } from "react";

const SWIPE_DISTANCE_PX = 45;

interface SwipeHandlers {
  onTouchStart: (event: TouchEvent) => void;
  onTouchEnd: (event: TouchEvent) => void;
}

export function useSwipe(onPrevious: () => void, onNext: () => void): SwipeHandlers {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart: (event) => {
      const touch = event.touches[0];
      start.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchEnd: (event) => {
      const origin = start.current;
      start.current = null;
      if (!origin) return;
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - origin.x;
      // A mostly vertical gesture is the guest scrolling the page.
      if (Math.abs(deltaX) < SWIPE_DISTANCE_PX || Math.abs(deltaX) < Math.abs(touch.clientY - origin.y)) return;
      if (deltaX > 0) onPrevious();
      else onNext();
    },
  };
}
