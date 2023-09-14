import { ElementMotionConfig, ElementMotionProp, spring } from './motion';

type MotionElement<T> = {
  value: T;
  prev?: MotionElement<T> | null;
  next?: MotionElement<T> | null;
  motion: ElementMotionConfig;
};

export class MotionList<T extends HTMLElement> {
  head: MotionElement<T> | null = null;
  tail: MotionElement<T> | null = null;
  lookupMap: Map<T, MotionElement<T>> = new Map();

  append(node: T, motion?: ElementMotionProp) {
    if (!node || !(node instanceof HTMLElement) || this.lookupMap.has(node)) return;

    const { width, height } = node.getBoundingClientRect();

    const config = {
      x: spring(0, motion?.x),
      y: spring(0, motion?.y),
      w: spring(width, motion?.w),
      h: spring(height, motion?.h),
      opacity: spring(1, motion?.opacity),
      scaleX: spring(1, motion?.scaleX),
      scaleY: spring(1, motion?.scaleY),
    } as ElementMotionConfig;

    const newNode = {
      value: node,
      prev: node.role === 'menuitem' && this.tail,
      next: null,
      motion: config,
    } as MotionElement<T>;

    // only add to the dll if it's a menuitem
    if (node.role === 'menuitem') {
      if (this.tail !== null) {
        this.tail.next = newNode;
      }

      this.tail = newNode;

      if (this.head === null) {
        this.head = newNode;
      }
    }

    this.lookupMap.set(node, newNode);
  }

  clear() {
    this.head = null;
    this.tail = null;
    this.lookupMap.clear();
  }
}
