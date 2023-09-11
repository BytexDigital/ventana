'use client';

import * as PopoverPrimitive from '@radix-ui/react-popover';
import React from 'react';
import './styles.css';
import { useControllableState } from './use-controllable-state';
import { PopoverProvider, usePopoverContext } from './popover-context';
import { useComposedRefs } from './use-composed-ref';
import { Slot } from '@radix-ui/react-slot';
import { useConstant } from './use-constant';

interface VentanaProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  modal?: boolean;
}

const Root = ({ children, open: openProp, defaultOpen, onOpenChange, modal = false }: VentanaProps) => {
  const [isOpen = false, setIsOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  });

  return (
    <PopoverPrimitive.Root modal={modal} open={isOpen} onOpenChange={setIsOpen}>
      <PopoverProvider>{children}</PopoverProvider>
    </PopoverPrimitive.Root>
  );
};

type TabProps = React.ComponentPropsWithoutRef<'div'>;

const Tab = React.forwardRef<HTMLDivElement, TabProps>((props, ref) => {
  const { tabRef, track } = usePopoverContext();
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

const Content = React.forwardRef<HTMLDivElement, ContentProps>(function ({ children, ...rest }, ref) {
  const { track, contentRef, contentBoundingRect, clear, focus, set, render } = usePopoverContext();

  // Combine the internal contentRef with the forwarded ref
  const composedRef = useComposedRefs(ref, contentRef);
  const isPressedDown = React.useRef(false);

  const scope = useConstant(() => {
    const ref = {
      current: null!,
    };

    Object.defineProperty(ref, 'current', {
      set: function (node: HTMLDivElement) {
        if (node) {
          if (node !== contentRef.current) {
            composedRef(node);
            track(node);
          }
          contentBoundingRect.current = node.getBoundingClientRect();
        }
      },
    });

    return ref;
  });

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

    (contentRef.current as Element).setPointerCapture(e.pointerId);
    isPressedDown.current = true;
    // not a fan but this is needed to prevent the pointerup event from suspending the pointermove event
    window.addEventListener('pointerup', onPointerUp);
  };

  const onPointerMoveCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPressedDown.current) return;
    if (!contentBoundingRect.current) return;

    // If the pointer is outside the content, scale the content
    if (e.clientY < contentBoundingRect.current.top || e.clientY > contentBoundingRect.current.bottom) {
      let distance = 0;
      const maxDistance = 100;
      const maxScale = 1.1;

      if (e.clientY < contentBoundingRect.current.top) {
        distance = contentBoundingRect.current.top - e.clientY;
        contentRef.current!.style.transformOrigin = 'bottom';
      } else {
        distance = e.clientY - contentBoundingRect.current.bottom;
        contentRef.current!.style.transformOrigin = 'top';
      }

      // Linear scaling based on distance, capped at maxScale
      const scaleFactor = 1 + (maxScale - 1) * (Math.min(distance, maxDistance) / maxDistance);
      set(contentRef.current, 'scaleY', 'dest', scaleFactor);

      render();
      return;
    }

    let target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target) return;

    while (target && target.role !== 'menuitem') {
      target = target.parentElement!;
      if (!target) break;
    }

    if (!target) return console.log('on capture no target');
    focus(target as HTMLElement, e.clientY);
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
      ref={scope}
      ventana-content=""
      onPointerMove={onPointerMoveCapture}
      onPointerDown={onPointerDown}
      //onPointerUp={onPointerUp}
      {...rest}
    >
      {children}
    </PopoverPrimitive.Content>
  );
});

Content.displayName = 'Ventana.Content';

type ItemProps = React.ComponentPropsWithoutRef<'button'> & {
  asChild?: boolean;
};

const Item = React.forwardRef<HTMLButtonElement, ItemProps>(({ children, disabled, asChild, ...rest }, ref) => {
  const { track, contentBoundingRect, set, tabRef, focus } = usePopoverContext();

  const scope = useConstant(() => {
    const ref = {
      current: null!,
    };

    Object.defineProperty(ref, 'current', {
      set: function (node: HTMLButtonElement) {
        if (node) {
          track(node);
        }
      },
      configurable: true,
      enumerable: true,
    });

    return ref;
  });

  const onPointerEnter = (e: React.PointerEvent<HTMLButtonElement>) => {
    const target = e.target as HTMLButtonElement | null;

    if (!target || disabled || target.role !== 'menuitem') return;

    focus(target, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const target = e.target as HTMLButtonElement | null;
    if (!target || disabled || target.role !== 'menuitem') return;
    if (!contentBoundingRect.current) return;

    const rect = target.getBoundingClientRect();

    const distanceFromMiddle = e.clientY - (rect.top + rect.height / 2);
    const normalizedDistance = distanceFromMiddle / (rect.height / 2);
    const translateY = 5 * Math.tanh(normalizedDistance);
    const hoveredElementTranslateY = translateY * 0.9; // 70% of the tabRef movement
    const relativeTop = rect.top - contentBoundingRect.current.top;

    tabRef.current && set(tabRef.current, 'y', 'dest', relativeTop + translateY);

    set(target, 'y', 'dest', hoveredElementTranslateY);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse') return;

    let target = e.target as HTMLElement;
    while (target && target.role !== 'menuitem') {
      target = target.parentElement!;
      if (!target) break;
    }

    if (!target || disabled || target.role !== 'menuitem') return;
    focus(target, e.clientY);
  };

  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      role="menuitem"
      ventana-item=""
      ref={scope}
      tabIndex={disabled === true ? undefined : -1}
      aria-disabled={disabled === true ? true : undefined}
      disabled={undefined}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      //onFocus={() => console.log('focus')}
      onPointerDown={onPointerDown}
      {...rest}
    >
      {children}
    </Comp>
  );
});

Item.displayName = 'Ventana.Item';

export const Ventana = {
  Root,
  Trigger: PopoverPrimitive.Trigger,
  Portal: PopoverPrimitive.Portal,
  Content,
  Item,
  Tab,
};
