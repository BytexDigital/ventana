import React from 'react';
import {
  springGoToEnd,
  Cache,
  springStep,
  MOTION_STEP,
  ElementMotionProp,
  ElementMotionConfig,
  MotionValues,
} from './motion';
import { MotionList } from './cache';

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
  track: (element: HTMLElement, motion?: ElementMotionProp) => void;
  reset: (element: Element | HTMLElement | null) => void;
  clear: () => void;
  set: (
    element: Element | HTMLElement | null,
    property: keyof ElementMotionConfig,
    subProperty: keyof MotionValues,
    value: number,
    immediate?: boolean,
  ) => void;
  render: () => void;
  focus: (target: HTMLElement, clientY: number) => void;

  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onFocus: (e: React.FocusEvent<HTMLDivElement>) => void;
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
  onKeyDown: () => {},
  onFocus: () => {},
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
  const newCache = React.useRef(new MotionList());
  const isRendering = React.useRef(false);
  const animatedUntilTime = React.useRef<number | null>(null);
  const animationFrame = React.useRef<number | null>(null);
  const isInitialFocus = React.useRef(true);

  const springForEach = (fn: (s: MotionValues) => void) => {
    for (const value of newCache.current.lookupMap.values()) {
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

    for (const [key, value] of newCache.current.lookupMap.entries()) {
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
    newCache.current.append(element, motion);
    // console.log('newCache.current', newCache.current.lookupMap);
  };

  const reset = (element: Element | HTMLElement | null) => {
    if (!element || !(element instanceof HTMLElement)) return;

    element.setAttribute('ventana-selected', 'false');
    element.setAttribute('aria-selected', 'false');

    const config = newCache.current.lookupMap.get(element)?.motion;
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

    const config = newCache.current.lookupMap.get(element)?.motion;
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
    newCache.current.clear();
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
      const initialWidth = newCache.current?.lookupMap.get(target)?.motion.w?.initial ?? 0;
      const initialHeight = newCache.current?.lookupMap.get(target)?.motion.h?.initial ?? 0;
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

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const hasFocused = isInitialFocus.current && selectedElementRef.current === null;

    if (['ArrowDown'].includes(e.key)) {
      // initial focus on first element
      if (hasFocused) {
        const firstElement = newCache.current.head?.value;
        if (firstElement) {
          focus(firstElement as HTMLElement, 0);
          //firstElement.focus();
          return;
        }
      }

      // focus on next element if exists or first element of menu if not
      if (selectedElementRef.current) {
        let nextElement = newCache.current.lookupMap.get(selectedElementRef.current)?.next?.value;

        if (nextElement === null || nextElement === undefined) {
          nextElement = newCache.current.head?.value;
        }

        focus(nextElement as HTMLElement, 0);
        return;
      }
    }

    if (['ArrowUp'].includes(e.key)) {
      // initial focus on last element
      if (hasFocused) {
        const lastElement = newCache.current.tail?.value;
        if (lastElement) {
          focus(lastElement as HTMLElement, 0);
          return;
        }
      }

      // focus on previous element if exists or last element of menu if not
      if (selectedElementRef.current) {
        let previousElement = newCache.current.lookupMap.get(selectedElementRef.current)?.prev?.value;

        console.log('previousElement', previousElement);

        if (previousElement === null || previousElement === undefined) {
          previousElement = newCache.current.tail?.value;
        }

        focus(previousElement as HTMLElement, 0);
        return;
      }
    }
  };

  const onFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    console.log('onFocus', e);
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
        onKeyDown,
        onFocus,
      }}
    >
      {children}
    </PopoverContext.Provider>
  );
};
