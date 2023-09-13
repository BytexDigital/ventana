'use client';
import React, { useCallback } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { useControllableState } from './use-controllable-state';
import { ElementMotionProp } from './motion';
import { useComposedRefs } from './use-composed-ref';
import { VentanaProvider, useVentanaContext } from './ventana-context';
import './styles.css';

type Direction = 'ltr' | 'rtl';

interface VentanaRootProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?(open: boolean): void;
  defaultOpen?: boolean;
  dir?: Direction;
  modal?: boolean;
}

const Root = ({ children, open: openProp, defaultOpen, onOpenChange, dir, modal = false }: VentanaRootProps) => {
  const [isOpen = false, setIsOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  });

  return (
    <DropdownMenuPrimitive.Root modal={modal} open={isOpen} onOpenChange={setIsOpen} dir={dir}>
      <VentanaProvider>{children}</VentanaProvider>
    </DropdownMenuPrimitive.Root>
  );
};

const Content = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 10, ...props }, ref) => {
  const { track, contentRef, contentRefBoundingRect, contentRefComputedStyle, clear } = useVentanaContext();
  const composedRef = useComposedRefs(ref, contentRef);
  const scoped = useCallback((node: any) => {
    if (node && !contentRef.current) {
      composedRef(node);
      track(node);
    }
  }, []);

  // run cleanup on unmount
  React.useEffect(() => {
    return () => {
      console.log('Content unmount');
      clear();
    };
  }, []);

  return (
    <DropdownMenuPrimitive.Content ref={scoped} sideOffset={sideOffset} className={className} {...props}>
      {props.children}
    </DropdownMenuPrimitive.Content>
  );
});

Content.displayName = 'Ventana.Content';

const Tab = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'> & {
    motion?: ElementMotionProp;
  }
>(({ className, motion, ...props }, forwardedRef) => {
  const { track, tabRef } = useVentanaContext();

  const composedRef = useComposedRefs(forwardedRef, tabRef);
  const scoped = useCallback((node: any) => {
    if (node && !tabRef.current) {
      composedRef(node);
      track(node, motion);
    }
  }, []);

  return <div ref={scoped} ventana-tab="" className={className} {...props} />;
});

Tab.displayName = 'Ventana.Tab';

const Item = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    motion?: ElementMotionProp;
  }
>(({ className, motion, ...props }, forwardedRef) => {
  const ref = React.useRef<React.ElementRef<typeof DropdownMenuPrimitive.Item>>(null);
  const { track, contentRefBoundingRect, contentRef, selectedElementRef, tabRef, cache, set, render, onFocus } =
    useVentanaContext();

  const composedRef = useComposedRefs(forwardedRef, ref);
  const scoped = useCallback((node: any) => {
    if (node && !ref.current) {
      composedRef(node);
      track(node, motion);
    }
  }, []);

  // const onFocus = (event: React.FocusEvent) => {
  //   console.log('onFocus', event);
  // };

  const onPointerMove = (event: React.PointerEvent) => {
    console.log('onPointerMove');
  };

  // const onFocus = (e: React.PointerEvent | React.FocusEvent) => {
  //   //console.log('onFocus', e);
  //   const target = e.target as HTMLElement;

  //   if (target.role !== 'menuitem' || target.ariaDisabled === 'true') return;

  //   const isFirstFocus = e.type === 'focus' && !selectedElementRef.current;

  //   if (selectedElementRef.current !== target) {
  //     // handle blur
  //     if (selectedElementRef.current) {
  //       set(selectedElementRef.current, 'scaleX', 'dest', 1);
  //       set(selectedElementRef.current, 'scaleY', 'dest', 1);
  //     }

  //     // handle focus first time opening the menu
  //     if (isFirstFocus) {
  //       console.log('first focus bound', contentRef.current?.getBoundingClientRect());
  //       target.style.scale = '1.1';
  //     }

  //     // const contentRefBounding = contentRef.current?.getBoundingClientRect();
  //     const contentRefBounding = contentRefBoundingRect.current;
  //     const targetBoundingClientRect = target.getBoundingClientRect();

  //     selectedElementRef.current = target;

  //     //const unscaledWidth = targetBoundingClientRect.width / 1.1;
  //     //const unscaledHeight = targetBoundingClientRect.height / 1.1;

  //     const unscaledWidth = cache.current?.get(target)?.w?.initial! / 1.1 ?? 0;
  //     const unscaledHeight = cache.current?.get(target)?.h?.initial! / 1.1 ?? 0;
  //     const unscaledTop = cache.current?.get(target)?.top?.initial! ?? 0;
  //     const unscaledLeft = cache.current?.get(target)?.left?.initial! ?? 0;

  //     console.log('unscaledWidth', unscaledWidth);
  //     console.log('unscaledHeight', unscaledHeight);
  //     console.log('unscaledTop', unscaledTop);
  //     console.log('unscaledLeft', unscaledLeft);
  //     console.log('contentRefBounding', contentRefBounding);
  //     console.log('targetBoundingClientRect', cache.current?.get(contentRef.current!));

  //     const widthDifference = targetBoundingClientRect.width - unscaledWidth;
  //     const heightDifference = targetBoundingClientRect.height - unscaledHeight;
  //     const translateX = unscaledLeft - contentRefBounding!.left - widthDifference / 2;
  //     const translateY = unscaledTop - contentRefBounding!.top - heightDifference / 2;

  //     //tabRef.current!.style.width = `${targetBoundingClientRect.width * 1.1}px`;
  //     //tabRef.current!.style.height = `${targetBoundingClientRect.height * 1.1}px`;

  //     set(tabRef.current!, 'w', 'dest', unscaledWidth * 1.1);
  //     set(tabRef.current!, 'h', 'dest', unscaledHeight * 1.1);
  //     set(tabRef.current!, 'x', 'dest', translateX);
  //     set(tabRef.current!, 'y', 'dest', translateY);

  //     set(target, 'scaleX', 'dest', 1.1);
  //     set(target, 'scaleY', 'dest', 1.1);

  //     // Apply the calculated translate values to the tab
  //     //tabRef.current!.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;

  //     if (tabRef.current) {
  //       //target.style.scale = '1.1';
  //       // tabRef.current.style.scale = '1.1';
  //       // tabRef.current.style.transformOrigin = 'center';
  //     }
  //   }

  //   // logic for focus
  //   if (e.type === 'focus') {
  //   }

  //   // logic for pointermove
  //   if (e.type === 'pointermove') {
  //   }

  //   render();

  //   //selectedElementRef.current = ref.current;
  //   e.preventDefault();
  // };

  // const onFocus = (e: React.PointerEvent | React.FocusEvent) => {
  //   const target = e.target as HTMLElement;

  //   //e.preventDefault();

  //   if (target.role !== 'menuitem' || target.ariaDisabled === 'true') return;

  //   const isInitialFocus = !selectedElementRef.current;

  //   //e.type === 'focus' &&

  //   // Capture initial bounding rect of target before any scaling

  //   const initialTargetBounding = target.getBoundingClientRect();
  //   const contentRefBounding = contentRef.current?.getBoundingClientRect();

  //   const unscaledWidth = cache.current?.get(target)?.w?.initial! / 1.1 ?? 0;
  //   const unscaledHeight = cache.current?.get(target)?.h?.initial! / 1.1 ?? 0;

  //   const widthDifference = initialTargetBounding.width - unscaledWidth;
  //   const heightDifference = initialTargetBounding.height - unscaledHeight;
  //   const translateX = initialTargetBounding.left - contentRefBounding!.left - widthDifference / 2;
  //   let translateY = initialTargetBounding.top - contentRefBounding!.top - heightDifference / 2;

  //   if (selectedElementRef.current !== target) {
  //     // handle blur
  //     if (selectedElementRef.current) {
  //       set(selectedElementRef.current, 'scaleX', 'dest', 1);
  //       set(selectedElementRef.current, 'scaleY', 'dest', 1);
  //     }

  //     selectedElementRef.current = target;

  //     if (isInitialFocus) {
  //       // If the event is a pointer move
  //       if (e.type === 'pointermove') {
  //         e = e as React.PointerEvent;
  //         const midpoint =
  //           initialTargetBounding.top + (window.scrollY ?? 0) + cache.current?.get(target)?.h?.initial! / 2;
  //         set(tabRef.current, 'y', 'dest', e.clientY < midpoint ? translateY - 10 : translateY + 10, true);
  //       }

  //       console.log('center', translateY);

  //       setTimeout(() => {
  //         set(target, 'scaleX', 'dest', 1.1, true);
  //         set(target, 'scaleY', 'dest', 1.1, true);
  //         set(tabRef.current!, 'w', 'dest', cache.current?.get(target)?.w?.initial! * 1.1, true);
  //         set(tabRef.current!, 'h', 'dest', cache.current?.get(target)?.h?.initial! * 1.1, true);
  //         set(tabRef.current!, 'x', 'dest', translateX, true);
  //         set(tabRef.current!, 'y', 'dest', translateY, e.type === 'focus');
  //         render();
  //       }, 0.1);

  //       return;
  //     }

  //     console.log('center', translateY);

  //     set(tabRef.current!, 'w', 'dest', cache.current?.get(target)?.w?.initial! * 1.1);
  //     set(tabRef.current!, 'h', 'dest', cache.current?.get(target)?.h?.initial! * 1.1);
  //     set(tabRef.current!, 'x', 'dest', translateX);
  //     set(tabRef.current!, 'y', 'dest', translateY);

  //     setTimeout(() => {
  //       set(target, 'scaleX', 'dest', 1.1);
  //       set(target, 'scaleY', 'dest', 1.1);
  //       render();
  //     }, 0);

  //     render();

  //     return;
  //     //isInitialFocus && set(tabRef.current, 'y', 'dest', translateY, true);
  //   }

  //   if (e.type == 'pointermove') {
  //     e = e as React.PointerEvent;

  //     const distanceFromMiddle = e.clientY - (initialTargetBounding.top + initialTargetBounding.height / 2);
  //     const normalizedDistance = distanceFromMiddle / (initialTargetBounding.height / 2);
  //     const wiggle = 2 * Math.tanh(normalizedDistance);

  //     console.log('pointermove', distanceFromMiddle, translateY + wiggle);

  //     set(tabRef.current, 'y', 'dest', translateY + wiggle);
  //     set(target, 'y', 'dest', wiggle * 0.9);
  //     render();
  //   }
  // };

  return (
    <DropdownMenuPrimitive.Item
      ref={scoped}
      onPointerMove={onFocus}
      onFocus={onFocus}
      className={className}
      ventana-item=""
      ventana-highlighted={selectedElementRef.current === ref.current ? '' : undefined}
      {...props}
    />
  );
});

Item.displayName = 'Ventana.Item';

export const Ventana = {
  Root,
  Trigger: DropdownMenuPrimitive.Trigger,
  Portal: DropdownMenuPrimitive.Portal,
  Content,
  Tab,
  Item,
};
