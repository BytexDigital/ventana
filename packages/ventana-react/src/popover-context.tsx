import React from 'react';
import { ElementSpringConfig, SpringConfig, spring, springGoToEnd, Cache, springStep, MOTION_STEP } from './motion';

interface PopoverContextValue {
  triggerRef: React.RefObject<HTMLElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  contentComputedCalculations: React.MutableRefObject<number>;
  contentBoundingRect: React.MutableRefObject<DOMRect | null>;
  tabRef: React.RefObject<HTMLDivElement>;
  selectedElementRef: React.MutableRefObject<HTMLButtonElement | null>;
  // spring
  cache: React.RefObject<Cache>;
  animationFrame: React.RefObject<number | null>;
  track: (element: Element | HTMLElement | null) => void;
  reset: (element: Element | HTMLElement | null) => void;
  clear: () => void;
  set: (
    element: Element | HTMLElement | null,
    property: keyof ElementSpringConfig,
    subProperty: keyof SpringConfig,
    value: number,
    immediate?: boolean,
  ) => void;
  render: () => void;
  focus: (target: HTMLElement, clientY: number) => void;
}

export const PopoverContext = React.createContext<PopoverContextValue>({
  triggerRef: { current: null },
  contentRef: { current: null },
  contentComputedCalculations: { current: 0 },
  contentBoundingRect: { current: null },
  tabRef: { current: null },
  selectedElementRef: { current: null },
  // spring
  cache: { current: null },
  animationFrame: { current: null },
  track: () => {},
  reset: () => {},
  clear: () => {},
  set: () => {},
  render: () => {},
  focus: () => {},
});

export const usePopoverContext = () => React.useContext(PopoverContext);

interface PopoverProviderProps {
  children: React.ReactNode;
}

export const PopoverProvider = ({ children }: PopoverProviderProps) => {
  const triggerRef = React.useRef<HTMLElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const contentComputedCalculations = React.useRef(0);
  const contentBoundingRect = React.useRef<DOMRect | null>(null);
  const tabRef = React.useRef<HTMLDivElement>(null);
  const selectedElementRef: React.MutableRefObject<HTMLButtonElement | null> = React.useRef<HTMLButtonElement | null>(
    null,
  );

  // spring
  const cache = React.useRef<Cache>(new Map());
  const isRendering = React.useRef(false);
  const animatedUntilTime = React.useRef<number | null>(null);
  const animationFrame = React.useRef<number | null>(null);

  const springForEach = (fn: (s: SpringConfig) => void) => {
    for (const value of cache.current.values()) {
      fn(value.x);
      fn(value.y);
      fn(value.w);
      fn(value.h);
      fn(value.opacity);
      fn(value.scaleX);
      fn(value.scaleY);
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

    for (const [key, value] of cache.current.entries()) {
      if (!key) continue;

      const element = key as HTMLElement;
      element.style.opacity = `${value.opacity.current}`;
      element.style.height = `${value.h.current}px`;
      element.style.width = `${value.w.current}px`;
      element.style.transform = `translate3d(${value.x.current}px,${value.y.current}px,0) scale(${value.scaleX.current},${value.scaleY.current})`;
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

  const track = (element: Element | HTMLElement | null) => {
    if (!element || !(element instanceof HTMLElement)) return;

    const { width, height } = element.getBoundingClientRect();

    const config = {
      x: spring(0),
      y: spring(0),
      w: spring(width),
      h: spring(height),
      opacity: spring(1),
      scaleX: spring(1),
      scaleY: spring(1),
    } satisfies ElementSpringConfig;

    cache.current.set(element, config);
  };

  const reset = (element: Element | HTMLElement | null) => {
    if (!element || !(element instanceof HTMLElement)) return;

    element.setAttribute('ventana-selected', 'false');
    element.setAttribute('aria-selected', 'false');

    const config = cache.current.get(element);
    if (!config) return;

    for (const prop in config) {
      config[prop as keyof ElementSpringConfig].dest = config[prop as keyof ElementSpringConfig].initial;
    }
  };

  const set = (
    element: Element | HTMLElement | null,
    property: keyof ElementSpringConfig,
    subProperty: keyof SpringConfig,
    value: number,
    immediate = false,
  ) => {
    if (!element || !(element instanceof HTMLElement)) return;

    const config = cache.current.get(element);
    if (!config) return;

    const springConfig = config[property];
    if (!springConfig) {
      console.error('Property not found in the ElementSpringConfig.');
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
    selectedElementRef.current = null;

    if (animationFrame.current) {
      window.cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
      isRendering.current = false;
    }
  };

  const focus = (target: HTMLElement, clientY: number) => {
    const containerRect = contentRef.current!.getBoundingClientRect();
    const rect = target.getBoundingClientRect();

    const distanceFromMiddle = clientY - (rect.top + rect.height / 2);
    const normalizedDistance = distanceFromMiddle / (rect.height / 2);
    const translateY = 5 * Math.tanh(normalizedDistance);
    const hoveredElementTranslateY = translateY * 0.9; // 70% of the tabRef movement
    const relativeTop = rect.top - containerRect.top;

    if (selectedElementRef.current !== target) {
      // Reset the previous element if it exists
      if (selectedElementRef.current) {
        reset(selectedElementRef.current);
      }

      // first time pointer enters so enter from pointer enter direction
      if (!selectedElementRef.current && tabRef.current) {
        contentComputedCalculations.current = parseInt(window.getComputedStyle(contentRef.current!).paddingLeft || '0');

        set(tabRef.current, 'y', 'dest', relativeTop + translateY * 3, true);
      }

      // Set the new element
      target.setAttribute('ventana-selected', 'true');
      target.setAttribute('aria-selected', 'true');

      // Update the ref to point to the current element
      selectedElementRef.current = target as HTMLButtonElement;

      // use the cache to get the initial values of the hovered element due to possible spring changes
      const initialWidth = cache.current?.get(target)?.w?.initial ?? 0;
      const initialHeight = cache.current?.get(target)?.h?.initial ?? 0;
      const widthIncrease = 0.1 * initialWidth;
      const halfWidthIncrease = widthIncrease / 2;

      if (tabRef.current) {
        set(tabRef.current, 'w', 'dest', initialWidth * 1.1, true);
        set(tabRef.current, 'h', 'dest', initialHeight * 1.1, true);
        set(tabRef.current, 'x', 'dest', 0 - halfWidthIncrease + contentComputedCalculations.current, true);
      }

      set(target, 'scaleY', 'dest', 1.1);
      set(target, 'scaleX', 'dest', 1.1);
    }

    if (tabRef.current) {
      set(tabRef.current, 'y', 'dest', relativeTop + translateY);
    }

    set(target, 'y', 'dest', hoveredElementTranslateY);
    render();
  };

  return (
    <PopoverContext.Provider
      value={{
        triggerRef,
        contentRef,
        contentComputedCalculations,
        contentBoundingRect,
        tabRef,
        selectedElementRef,
        cache,
        animationFrame,
        track,
        reset,
        clear,
        set,
        render,
        focus,
      }}
    >
      {children}
    </PopoverContext.Provider>
  );
};
