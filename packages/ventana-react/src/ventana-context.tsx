import React from 'react';
import {
  springGoToEnd,
  springStep,
  MOTION_STEP,
  ElementMotionProp,
  ElementMotionConfig,
  MotionValues,
} from './ventana-motion';
import { MotionList } from './ventana-cache';

interface VentanaContextValue {
  triggerRef: React.RefObject<HTMLElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  contentRefDimensions: React.MutableRefObject<DOMRect | null>;
  tabRef: React.RefObject<HTMLDivElement>;
  selectedElementRef: React.MutableRefObject<HTMLDivElement | null>;
  // spring
  track: (element: HTMLElement, motion?: ElementMotionProp) => void;
  clear: () => void;
  set: (
    element: Element | HTMLElement | null,
    property: keyof ElementMotionConfig,
    subProperty: keyof MotionValues,
    value: number,
    immediate?: boolean,
  ) => void;
  render: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onFocus: (e: React.FocusEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>) => void;
  onOpenChange?: (open: boolean) => void;
}

export const VentanaContext = React.createContext<VentanaContextValue>({
  triggerRef: { current: null },
  contentRef: { current: null },
  contentRefDimensions: { current: null },
  tabRef: { current: null },
  selectedElementRef: { current: null },
  // spring
  track: () => {},
  clear: () => {},
  set: () => {},
  render: () => {},
  onKeyDown: () => {},
  onFocus: () => {},
  onOpenChange: () => {},
});

export const useVentanaContext = () => React.useContext(VentanaContext);

interface PopoverProviderProps {
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export const VentanaContextProvider = ({ children, onOpenChange }: PopoverProviderProps) => {
  const triggerRef = React.useRef<HTMLElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const contentRefDimensions = React.useRef<DOMRect | null>(null);
  const tabRef = React.useRef<HTMLDivElement>(null);
  const selectedElementRef: React.MutableRefObject<HTMLDivElement | null> = React.useRef<HTMLDivElement | null>(null);

  const cache = React.useRef(new MotionList());
  const isRendering = React.useRef(false);
  const animatedUntilTime = React.useRef<number | null>(null);
  const animationFrame = React.useRef<number | null>(null);
  const isInitialFocus = React.useRef(true);

  const springForEach = (fn: (s: MotionValues) => void) => {
    for (const value of cache.current.lookupMap.values()) {
      const motion = value.motion;
      fn(motion.x);
      fn(motion.y);
      fn(motion.w);
      fn(motion.h);
      fn(motion.opacity);
      fn(motion.scaleX);
      fn(motion.scaleY);
    }
  };

  const animate = (timestamp: number) => {
    let newAnimatedUntilTime = animatedUntilTime.current ?? timestamp;
    const steps = Math.floor((timestamp - newAnimatedUntilTime) / MOTION_STEP);

    newAnimatedUntilTime += steps * MOTION_STEP;

    let stillAnimating = false;

    springForEach((s) => {
      for (let i = 0; i < steps; i++) springStep(s);

      if (Math.abs(s.v) < 0.01 && Math.abs(s.dest - s.current) < 0.01) {
        springGoToEnd(s);
      } else {
        stillAnimating = true;
      }
    });

    for (const [key, value] of cache.current.lookupMap.entries()) {
      if (!key) continue;
      const motion = value.motion;
      if (!motion) continue;

      const element = key as HTMLElement;
      element.style.opacity = `${motion.opacity.current}`;
      element.style.height = `${motion.h.current}px`;
      element.style.width = `${motion.w.current}px`;
      element.style.transform = `translate3d(${motion.x.current}px,${motion.y.current}px,0) scale(${motion.scaleX.current},${motion.scaleY.current})`;
    }

    animatedUntilTime.current = stillAnimating ? newAnimatedUntilTime : null;
    return stillAnimating;
  };

  const render = () => {
    if (isRendering.current) return;

    isRendering.current = true;
    animationFrame.current = requestAnimationFrame((timestamp) => {
      isRendering.current = false;
      if (animate(timestamp)) render();
    });
  };

  const track = (element: HTMLElement, motion?: ElementMotionProp) => {
    if (!element || !(element instanceof HTMLElement)) return;
    cache.current.append(element, motion);
  };

  const reset = (element: Element | HTMLElement | null) => {
    if (!element || !(element instanceof HTMLElement)) return;

    element.setAttribute('ventana-selected', 'false');
    element.setAttribute('aria-selected', 'false');

    const config = cache.current.lookupMap.get(element)?.motion;
    if (!config) return;

    for (const prop in config) {
      config[prop as keyof ElementMotionConfig].dest = config[prop as keyof ElementMotionConfig].initial;
    }
  };

  const set = (
    element: Element | HTMLElement | null,
    property: keyof ElementMotionConfig,
    subProperty: keyof MotionValues,
    value: number,
    immediate = false,
  ) => {
    if (!element || !(element instanceof HTMLElement)) return;

    const config = cache.current.lookupMap.get(element)?.motion;
    if (!config) return;

    const springConfig = config[property];
    if (!springConfig) {
      return;
    }

    springConfig[subProperty] = value;

    // apply changes immediately: dest -> current
    if (immediate) {
      springGoToEnd(springConfig);
    }
  };

  const clear = () => {
    cache.current.clear();
    cache.current.clear();
    selectedElementRef.current = null;

    if (animationFrame.current) {
      window.cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
      isRendering.current = false;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const hasFocused = isInitialFocus.current && selectedElementRef.current === null;

    if (['ArrowDown', 'ArrowRight'].includes(e.key)) {
      // initial focus on first element
      if (hasFocused) {
        const firstElement = cache.current.head?.value;
        if (firstElement) {
          //focus(firstElement as HTMLElement, 0);
          firstElement.focus();
          return;
        }
      }

      // focus on next element if exists or first element of menu if not
      if (selectedElementRef.current) {
        let nextElement = cache.current.lookupMap.get(selectedElementRef.current)?.next?.value;

        if (nextElement === null || nextElement === undefined) {
          nextElement = cache.current.head?.value;
        }

        //focus(nextElement as HTMLElement, 0);
        nextElement?.focus();
        return;
      }
    }

    if (['ArrowUp', 'ArrowLeft'].includes(e.key)) {
      // initial focus on last element
      if (hasFocused) {
        const lastElement = cache.current.tail?.value;
        if (lastElement) {
          //focus(lastElement as HTMLElement, 0);
          lastElement.focus();
          return;
        }
      }

      // focus on previous element if exists or last element of menu if not
      if (selectedElementRef.current) {
        let previousElement = cache.current.lookupMap.get(selectedElementRef.current)?.prev?.value;

        if (previousElement === null || previousElement === undefined) {
          previousElement = cache.current.tail?.value;
        }

        //focus(previousElement as HTMLElement, 0);
        previousElement?.focus();
        return;
      }
    }
  };

  const onFocus = (
    e: React.FocusEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>,
    focusedTarget?: HTMLDivElement,
  ) => {
    const target =
      focusedTarget !== undefined && focusedTarget !== null ? focusedTarget : (e.target as HTMLDivElement | null);
    if (target === null || target.role !== 'menuitem') return;

    const isInitialFocus = !selectedElementRef.current;
    //TODO: optimise this
    const containerRect = contentRef.current!.getBoundingClientRect();
    const rect = target.getBoundingClientRect();

    const scaleFactor = 1.1;

    const originalWidth = cache.current?.lookupMap.get(target)?.motion.w?.initial ?? 0;
    const originalHeight = cache.current?.lookupMap.get(target)?.motion.h?.initial ?? 0;

    const middleY = (rect.top + rect.bottom) / 2;

    const scaledHeight = originalHeight * scaleFactor;
    const heightDifference = scaledHeight - originalHeight;

    const itemY = rect.top - containerRect.top;

    const newTabY = itemY - heightDifference / 2;
    const newTabX = 0 - (originalWidth * 0.1) / 2;

    if (selectedElementRef.current !== target) {
      // Reset the previous element if it exists
      selectedElementRef.current && reset(selectedElementRef.current);
      selectedElementRef.current = target;

      // set aria attributes on the new element and the content element
      target.setAttribute('ventana-selected', 'true');
      target.setAttribute('aria-selected', 'true');
      contentRef.current?.setAttribute('aria-activedescendant', target.id);
    }

    if (isInitialFocus) {
      // if the event is a pointer move on initial focus ease the tab into position
      if (e.type === 'pointermove') {
        e = e as React.PointerEvent<HTMLDivElement>;
        const mouseY = e.clientY;
        set(tabRef.current!, 'y', 'dest', mouseY < middleY ? newTabY - 10 : newTabY + 10, true);
      }

      set(target!, 'scaleX', 'dest', 1.1, e.type === 'focus');
      set(target!, 'scaleY', 'dest', 1.1, e.type === 'focus');
      set(tabRef.current!, 'w', 'dest', originalWidth * 1.1, true);
      set(tabRef.current!, 'h', 'dest', originalHeight * 1.1, true);
      set(tabRef.current!, 'x', 'dest', newTabX, true);
      set(tabRef.current!, 'y', 'dest', newTabY, e.type === 'focus');

      render();
      return;
    }

    // (on)focus specfic logic
    if (e.type === 'focus') {
      e = e as React.FocusEvent<HTMLDivElement>;

      set(tabRef.current, 'y', 'dest', newTabY);
      set(tabRef.current, 'h', 'dest', originalHeight * 1.1);
      set(target, 'scaleX', 'dest', 1.1);
      set(target, 'scaleY', 'dest', 1.1);

      render();
      return;
    }

    // pointermove specific logic
    if (e.type === 'pointermove') {
      e = e as React.PointerEvent<HTMLDivElement>;

      // use tanh to create a dampened effect on the tab movement
      const distanceFromMiddle = e.clientY - middleY;
      const normalizedDistance = distanceFromMiddle / (rect.height / 2);
      const tanhY = 5 * Math.tanh(normalizedDistance);
      const dampY = tanhY * 0.9; // 90% of the tabRef movement

      if (tabRef.current) {
        set(tabRef.current, 'y', 'dest', newTabY + tanhY);
        set(tabRef.current, 'h', 'dest', originalHeight * 1.1);
        set(target, 'y', 'dest', dampY);
        set(target, 'scaleX', 'dest', 1.1);
        set(target, 'scaleY', 'dest', 1.1);
        render();
      }

      return;
    }
  };

  return (
    <VentanaContext.Provider
      value={{
        triggerRef,
        contentRef,
        contentRefDimensions,
        tabRef,
        selectedElementRef,
        track,
        clear,
        set,
        render,
        onKeyDown,
        onFocus,
        onOpenChange,
      }}
    >
      {children}
    </VentanaContext.Provider>
  );
};
