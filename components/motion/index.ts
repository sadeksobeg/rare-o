export {
  resolveMotionTier,
  surfaceFromPathname,
  isWeakDevice,
  STAGGER_MS,
  RIPPLE_MS,
  AMBIENT_MAX_MS,
  ADMIN_MAX_MS,
  type MotionTier,
  type MotionSurface,
  type MotionTierInput,
} from "./resolve-tier";
export { MotionProvider } from "./provider";
export { useMotion } from "./context";
export { Reveal, MaskReveal, Stagger } from "./reveal";
export { PressRipple, spawnPressRipple } from "./press-ripple";
export { LiveBadge } from "./live-badge";
export { StringLine } from "./string-line";
export { DrawIn, RosetteMark } from "./draw-in";
export { AnimatedIcon } from "./animated-icon";
export { TiltSurface } from "./tilt-surface";
export { flyToTarget } from "./fly-to-target";
export { CountUp } from "./count-up";
export { useScrollSpy } from "./use-scroll-spy";
export { useAmbientMotion } from "./use-ambient";
export {
  portalFadeUp,
  portalDurations,
  portalStagger,
  portalPress,
  enterTransition,
  exitTransition,
} from "./presets";
export { PageEnter, PageEnterLiteAware } from "./page-enter";
