export type SpringConfig = {
  initial: number;
  current: number;
  dest: number;
  v: number;
  k: number;
  b: number;
};

export type ElementSpringConfig = {
  x: SpringConfig;
  y: SpringConfig;
  w: SpringConfig;
  h: SpringConfig;
  opacity: SpringConfig;
  scaleX: SpringConfig;
  scaleY: SpringConfig;
};

export type Cache = Map<Element, ElementSpringConfig>;

// 60fps = 16.666ms per frame
export const MOTION_STEP = 17;

// k = stiffness, b = damping. Higher k = more springy, higher b = more dampened
export const spring = (pos: number, v = 0, k = 150, b = 15) => {
  return {
    initial: pos,
    current: pos,
    dest: pos,
    v,
    k,
    b,
  } satisfies SpringConfig;
};

export const springStep = (config: SpringConfig) => {
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

  config.current = newPos;
  config.v = newV;
};

// end spring
export const springGoToEnd = (config: SpringConfig) => {
  config.current = config.dest;
  config.v = 0;
};
