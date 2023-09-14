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
  // top: MotionValues;
  // left: MotionValues;
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
  // https://blog.maximeheckel.com/posts/the-physics-behind-spring-animations/
  // this seems inspired by https://github.com/chenglou/react-motion/blob/9e3ce95bacaa9a1b259f969870a21c727232cc68/src/stepper.js
  const t = MOTION_STEP / 1000; // convert to seconds for the physics equation
  const { current, dest, v, k, b } = config;
  // for animations, dest is actually spring at rest. Current position is the spring's stretched/compressed state
  const Fspring = -k * (current - dest); // Spring stiffness, in kg / s^2
  const Fdamper = -b * v; // Damping, in kg / s
  const a = Fspring + Fdamper; // a needs to be divided by mass, but we'll assume mass of 1. Adjust k and b to change spring curve instead
  const newV = v + a * t;
  const newPos = current + newV * t;

  //console.table({ current, dest, v, k, b, Fspring, Fdamper, a, newV, newPos });

  config.current = newPos;
  config.v = newV;
};

// end spring
export const springGoToEnd = (config: MotionValues) => {
  config.current = config.dest;
  config.v = 0;
};
