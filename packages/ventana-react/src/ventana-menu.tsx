'use client';

import * as PopoverPrimitive from '@radix-ui/react-popover';
import React, { useId } from 'react';
import './styles.css';
import { useControllableState } from './use-controllable-state';
import { useComposedRefs } from './use-composed-ref';
import { Slot } from '@radix-ui/react-slot';
import { ElementMotionProp } from './ventana-motion';
import { mergeEventHandlers } from './merge-event-handlers';
import { VentanaContextProvider, useVentanaContext } from './ventana-context';

interface VentanaProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  modal?: boolean;
}

const Root = ({ children, open: openProp, defaultOpen, onOpenChange, modal = true }: VentanaProps) => {
  const [isOpen = false, setIsOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  });

  return (
    <PopoverPrimitive.Root modal={modal} open={isOpen} onOpenChange={setIsOpen}>
      <VentanaContextProvider onOpenChange={setIsOpen}>{children}</VentanaContextProvider>
    </PopoverPrimitive.Root>
  );
};

type TabProps = React.ComponentPropsWithoutRef<'div'>;

const Tab = React.forwardRef<HTMLDivElement, TabProps>((props, ref) => {
  const { tabRef, track } = useVentanaContext();
  const composedRef = useComposedRefs(ref, tabRef);

  return (
    <div
      ref={React.useCallback((node: HTMLDivElement) => {
        if (!node) return;
        track(node);
        composedRef(node);
      }, [])}
      ventana-tab=""
      {...props}
    ></div>
  );
});

type ContentProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>;

const Content = React.forwardRef<HTMLDivElement, ContentProps>(function ({ children, ...rest }, forwardedRef) {
  const { track, contentRef, contentRefDimensions, clear, set, onFocus, render, onKeyDown } = useVentanaContext();

  // Combine the internal contentRef with the forwarded ref
  const isPressedDown = React.useRef(false);

  const composedRef = useComposedRefs(forwardedRef, contentRef);

  const scoped = React.useCallback((node: HTMLDivElement) => {
    if (!node) return;
    composedRef(node);
    track(node);
  }, []);

  const onPointerUp = (e: PointerEvent) => {
    if (!isPressedDown.current) return;

    window.removeEventListener('pointerup', onPointerUp);

    set(contentRef.current!, 'scaleY', 'dest', 1);

    (contentRef.current as Element).releasePointerCapture(e.pointerId);
    isPressedDown.current = false;

    render();
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPressedDown.current) return;

    contentRefDimensions.current = contentRef.current!.getBoundingClientRect();

    (contentRef.current as Element).setPointerCapture(e.pointerId);
    isPressedDown.current = true;

    window.addEventListener('pointerup', onPointerUp);
  };

  const onPointerMoveCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPressedDown.current) return;
    if (!contentRefDimensions.current) return;

    // If the pointer is outside the content, scale the content
    if (e.clientY < contentRefDimensions.current.top || e.clientY > contentRefDimensions.current.bottom) {
      let distance = 0;
      const maxDistance = 100;
      const maxScale = 1.1;

      if (e.clientY < contentRefDimensions.current.top) {
        distance = contentRefDimensions.current.top - e.clientY;
        contentRef.current!.style.transformOrigin = 'bottom';
      } else {
        distance = e.clientY - contentRefDimensions.current.bottom;
        contentRef.current!.style.transformOrigin = 'top';
      }

      // Linear scaling based on distance, capped at maxScale
      const scaleFactor = 1 + (maxScale - 1) * (Math.min(distance, maxDistance) / maxDistance);
      set(contentRef.current, 'scaleY', 'dest', scaleFactor);

      render();
      return;
    }

    let target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || target.role !== 'menuitem') return;

    onFocus(e);
    (target as HTMLDivElement).focus();
  };

  React.useEffect(() => {
    // run spring context cleanup on unmount
    return () => {
      clear();
    };
  }, []);

  return (
    <PopoverPrimitive.Content
      role="menu"
      ref={scoped}
      aria-activedescendant=""
      ventana-content=""
      onPointerMove={onPointerMoveCapture}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      //onPointerUp={onPointerUp}
      {...rest}
    >
      {children}
    </PopoverPrimitive.Content>
  );
});

Content.displayName = 'Ventana.Content';

type ItemProps = React.ComponentPropsWithoutRef<'div'> & {
  asChild?: boolean;
  disabled?: boolean;
  motion?: ElementMotionProp;
};

const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ children, disabled, asChild, onClick, motion, ...props }, forwardedRef) => {
    const { track, onFocus, onOpenChange } = useVentanaContext();
    const isPointerDown = React.useRef(false);
    const itemRef = React.useRef<HTMLDivElement>(null);
    const id = useId();
    const composedRef = useComposedRefs(forwardedRef, itemRef);

    const scoped = React.useCallback((node: HTMLDivElement) => {
      if (!node) return;
      composedRef(node);
      track(node, motion);
    }, []);

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement | null;
      if (!target || target.role !== 'menuitem') return;

      onFocus(e);
      target.focus();
    };

    const onSelect = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      mergeEventHandlers(
        onClick,
        (e) => {
          if (e.defaultPrevented) {
            isPointerDown.current = false;
          } else {
            onOpenChange?.(false);
          }
        },
        false,
      )(e);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (['Enter', ' '].includes(e.key)) {
        (e.target as HTMLDivElement)?.click();
        e.preventDefault();
      }
    };

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      props.onPointerDown?.(e);
      isPointerDown.current = true;
    };

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isPointerDown.current) return;
      itemRef.current?.click();
    };

    const Comp = asChild ? Slot : 'div';

    return (
      <Comp
        {...props}
        id={'ventana-' + id}
        role="menuitem"
        ventana-item=""
        ref={scoped}
        tabIndex={disabled === true ? undefined : -1}
        aria-disabled={disabled === true ? true : undefined}
        data-disabled={disabled === true ? '' : undefined}
        onPointerMove={onPointerMove}
        //@ts-ignore
        onFocus={onFocus}
        onClick={onSelect}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {children}
      </Comp>
    );
  },
);

Item.displayName = 'Ventana.Item';

export const Ventana = {
  Root,
  Trigger: PopoverPrimitive.Trigger,
  Portal: PopoverPrimitive.Portal,
  Content,
  Item,
  Tab,
};
