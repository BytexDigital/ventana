export type MotionValues = {
  initial: number;
  current: number;
  dest: number;
  v: number;
  k: number;
  b: number;
};

export type ElementMotionConfig = {
  x: MotionValues;
  y: MotionValues;
  w: MotionValues;
  h: MotionValues;
  opacity: MotionValues;
  scaleX: MotionValues;
  scaleY: MotionValues;
};

export type MotionCustomValues = {
  stiffness?: number;
  dampness?: number;
};

export type ElementMotionProp = Partial<Record<keyof ElementMotionConfig, MotionCustomValues>>;

export type Cache = Map<Element, ElementMotionConfig>;

// 60fps = 16.666ms per frame
export const MOTION_STEP = 17;

const DEFAULT_STIFFNESS = 150;
const DEFAULT_DAMPNESS = 15;

// k = stiffness, b = damping. Higher k = more springy, higher b = more dampened
export const spring = (pos: number, motion?: MotionCustomValues) => {
  return {
    initial: pos,
    current: pos,
    dest: pos,
    v: 0,
    k: motion?.stiffness ?? DEFAULT_STIFFNESS,
    b: motion?.dampness ?? DEFAULT_DAMPNESS,
  } satisfies MotionValues;
};

export const springStep = (config: MotionValues) => {
  const t = MOTION_STEP / 1000;
  const { current, dest, v, k, b } = config;
  const Fspring = -k * (current - dest);
  const Fdamper = -b * v;
  const a = Fspring + Fdamper;
  const newV = v + a * t;
  const newPos = current + newV * t;

  config.current = newPos;
  config.v = newV;
};

// end spring
export const springGoToEnd = (config: MotionValues) => {
  config.current = config.dest;
  config.v = 0;
};
