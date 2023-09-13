import React from 'react';
import {
  Cache,
  ElementMotionConfig,
  ElementMotionProp,
  MOTION_STEP,
  MotionValues,
  spring,
  springGoToEnd,
  springStep,
} from './motion';
import { DropdownMenuContent, DropdownMenuItem } from '@radix-ui/react-dropdown-menu';

interface VentanaContextValue {
  //   triggerRef: React.RefObject<HTMLElement>;
  //   contentRef: React.RefObject<HTMLDivElement>;
  //   contentComputedCalculations: React.MutableRefObject<number>;
  //   contentBoundingRect: React.MutableRefObject<DOMRect | null>;
  tabRef: React.MutableRefObject<HTMLElement | null>;
  contentRef: React.MutableRefObject<React.ElementRef<typeof DropdownMenuContent> | null>;
  contentRefBoundingRect: React.MutableRefObject<DOMRect | null>;
  contentRefComputedStyle: React.MutableRefObject<number | null>;
  selectedElementRef: React.MutableRefObject<HTMLDivElement | HTMLElement | null>;

  //   selectedElementRef: React.MutableRefObject<HTMLButtonElement | null>;
  //   // spring
  cache: React.RefObject<Cache>;
  track: (element: Element | HTMLElement | null, motion?: ElementMotionProp) => void;
  render: () => void;
  clear: () => void;
  onFocus: (e: React.FocusEvent | React.PointerEvent) => void;
  set: (
    element: Element | HTMLElement | null,
    property: keyof ElementMotionConfig,
    subProperty: keyof MotionValues,
    value: number,
    immediate?: boolean,
  ) => void;
  //   reset: (element: Element | HTMLElement | null) => void;
  //   clear: () => void;
  //   set: (
  //     element: Element | HTMLElement | null,
  //     property: keyof ElementSpringConfig,
  //     subProperty: keyof SpringConfig,
  //     value: number,
  //     immediate?: boolean,
  //   ) => void;
  //   render: () => void;
  //   focus: (target: HTMLElement, clientY: number) => void;
}

export const VentanaContext = React.createContext<VentanaContextValue>({
  //   triggerRef: { current: null },
  //   contentRef: { current: null },
  //   contentComputedCalculations: { current: 0 },
  //   contentBoundingRect: { current: null },
  tabRef: { current: null },
  contentRef: { current: null },
  contentRefBoundingRect: { current: null },
  contentRefComputedStyle: { current: null },
  selectedElementRef: { current: null },
  //   selectedElementRef: { current: null },
  //   // spring
  cache: { current: null },
  track: () => {},
  render: () => {},
  clear: () => {},
  onFocus: () => {},
  set: () => {},
  //   reset: () => {},
  //   clear: () => {},
  //   set: () => {},
  //   render: () => {},
  //   focus: () => {},
});

export const useVentanaContext = () => React.useContext(VentanaContext);

export const VentanaProvider = ({ children }: { children: React.ReactNode }) => {
  const cache = React.useRef<Cache>(new Map());
  const tabRef = React.useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement | null>;
  const contentRef = React.useRef<React.ElementRef<typeof DropdownMenuContent>>(null) as React.MutableRefObject<
    typeof DropdownMenuContent | null
  >;
  const contentRefBoundingRect = React.useRef<DOMRect | null>(null);
  const contentRefComputedStyle = React.useRef<number | null>(null);
  const selectedElementRef = React.useRef<HTMLElement>(null) as React.MutableRefObject<HTMLElement | null>;
  const selectedElementBoundingRect = React.useRef<DOMRect | null>(null);

  const isRendering = React.useRef(false);
  const animatedUntilTime = React.useRef<number | null>(null);
  const animationFrame = React.useRef<number | null>(null);

  const track = (element: Element | HTMLElement | null, motion?: ElementMotionProp) => {
    if (!element || !(element instanceof HTMLElement) || cache.current.has(element)) return;

    const { width, height, top, left } = element.getBoundingClientRect();

    const config = {
      x: spring(0, motion?.x),
      y: spring(0, motion?.y),
      w: spring(width, motion?.w),
      h: spring(height, motion?.h),
      opacity: spring(1, motion?.opacity),
      scaleX: spring(1, motion?.scaleX),
      scaleY: spring(1, motion?.scaleY),
      top: spring(top, motion?.top),
      left: spring(left, motion?.left),
    } satisfies ElementMotionConfig;

    cache.current.set(element, config);
  };

  const set = (
    element: Element | HTMLElement | null,
    property: keyof ElementMotionConfig,
    subProperty: keyof MotionValues,
    value: number,
    immediate = false,
  ) => {
    if (!element || !(element instanceof HTMLElement)) return console.log('e1');

    const config = cache.current.get(element);
    if (!config) return console.log('e2');

    const springConfig = config[property];
    if (!springConfig) {
      return console.log('e3');
    }

    springConfig[subProperty] = value;

    // apply changes immediately: dest -> current
    if (immediate) {
      springGoToEnd(springConfig);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {};

  const onBlur = (element: HTMLElement) => {
    if (!element || !(element instanceof HTMLElement)) return;

    const config = cache.current.get(element);
    if (!config) return;

    for (const prop in config) {
      config[prop as keyof ElementMotionConfig].dest = config[prop as keyof ElementMotionConfig].initial;
    }
  };

  const springForEach = (fn: (s: MotionValues) => void) => {
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
      if (!key) {
        console.log('!key');
        continue;
      }

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

  const onFocus = (e: React.PointerEvent | React.FocusEvent) => {
    const target = e.target as HTMLElement;

    //e.preventDefault();

    if (target.role !== 'menuitem' || target.ariaDisabled === 'true') return;

    const isInitialFocus = !selectedElementRef.current;

    //e.type === 'focus' &&

    // Capture initial bounding rect of target before any scaling

    const initialTargetBounding = target.getBoundingClientRect();
    console.log('initialTargetBounding', initialTargetBounding);
    console.log('cache values', cache.current?.get(target)?.left?.initial!, cache.current?.get(target)?.top?.initial!);
    const contentRefBounding = contentRefBoundingRect.current ?? contentRef.current?.getBoundingClientRect();

    const unscaledWidth = cache.current?.get(target)?.w?.initial! / 1.1 ?? 0;
    const unscaledHeight = cache.current?.get(target)?.h?.initial! / 1.1 ?? 0;

    const widthDifference = cache.current?.get(target)?.w?.initial! - unscaledWidth;
    const heightDifference = cache.current?.get(target)?.h?.initial! - unscaledHeight;
    let translateX = initialTargetBounding.left - contentRefBounding!.left - widthDifference / 2;
    let translateY = initialTargetBounding.top - contentRefBounding!.top - heightDifference / 2;

    if (selectedElementRef.current !== target) {
      // handle blur
      if (selectedElementRef.current) {
        set(selectedElementRef.current, 'scaleX', 'dest', 1);
        set(selectedElementRef.current, 'scaleY', 'dest', 1);
      }

      selectedElementRef.current = target;
      //selectedElementBoundingRect.current = target.getBoundingClientRect();

      if (isInitialFocus) {
        // If the event is a pointer move
        if (e.type === 'pointermove') {
          e = e as React.PointerEvent;
          const midpoint =
            initialTargetBounding.top + (window.scrollY ?? 0) + cache.current?.get(target)?.h?.initial! / 2;
          set(tabRef.current, 'y', 'dest', e.clientY < midpoint ? translateY - 10 : translateY + 10, true);
        }

        //console.log('center', translateY);

        setTimeout(() => {
          contentRefBoundingRect.current = contentRef.current?.getBoundingClientRect();
          set(target, 'scaleX', 'dest', 1.1, true);
          set(target, 'scaleY', 'dest', 1.1, true);
          set(tabRef.current!, 'w', 'dest', cache.current?.get(target)?.w?.initial! * 1.1, true);
          set(tabRef.current!, 'h', 'dest', cache.current?.get(target)?.h?.initial! * 1.1, true);
          set(tabRef.current!, 'x', 'dest', translateX, true);
          set(tabRef.current!, 'y', 'dest', translateY, e.type === 'focus');
          render();
        }, 0.1);

        return;
      }

      // console.log('center', contentRefBoundingRect.current);

      set(tabRef.current!, 'w', 'dest', cache.current?.get(target)?.w?.initial! * 1.1);
      set(tabRef.current!, 'h', 'dest', cache.current?.get(target)?.h?.initial! * 1.1);
      set(tabRef.current!, 'x', 'dest', translateX);
      set(tabRef.current!, 'y', 'dest', translateY);

      setTimeout(() => {
        set(target, 'scaleX', 'dest', 1.1);
        set(target, 'scaleY', 'dest', 1.1);
        render();
      }, 0);

      render();

      return;
      //isInitialFocus && set(tabRef.current, 'y', 'dest', translateY, true);
    }

    if (e.type == 'pointermove') {
      e = e as React.PointerEvent;

      const distanceFromMiddle = e.clientY - (initialTargetBounding.top + initialTargetBounding.height / 2);
      const normalizedDistance = distanceFromMiddle / (initialTargetBounding.height / 2);
      const wiggle = 5 * Math.tanh(normalizedDistance);

      //console.log('pointermove', distanceFromMiddle, translateY + wiggle);

      set(tabRef.current, 'y', 'dest', translateY + wiggle);
      set(target, 'y', 'dest', wiggle * 0.9);
      render();
    }
  };

  const clear = () => {
    console.log('clear called');
    cache.current.clear();
    selectedElementRef.current = null;
    tabRef.current = null;
    contentRef.current = null;
    contentRefBoundingRect.current = null;

    if (animationFrame.current) {
      window.cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
      isRendering.current = false;
    }
  };

  return (
    <VentanaContext.Provider
      value={{
        tabRef,
        contentRef,
        contentRefBoundingRect,
        contentRefComputedStyle,
        selectedElementRef,
        cache,
        track,
        render,
        clear,
        onFocus,
        set,
      }}
    >
      {children}
    </VentanaContext.Provider>
  );
};
