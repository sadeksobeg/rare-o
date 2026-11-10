/** Motion tokens from the design system. CSS durations live in `styles/tokens.css`. */
export const dur = {
  instant: 0.08,
  fast: 0.14,
  base: 0.22,
  slow: 0.36,
  enter: 0.48,
} as const;

export const ease = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  in: [0.4, 0, 1, 1] as const,
};

export const spring = {
  snappy: { type: "spring" as const, stiffness: 420, damping: 32 },
  soft: { type: "spring" as const, stiffness: 260, damping: 28 },
};

export const stagger = { step: 0.04, max: 8 } as const;
