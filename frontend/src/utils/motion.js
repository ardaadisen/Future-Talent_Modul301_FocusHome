
/** Stagger delay for sequential enter animations (ms). */
export const staggerDelay = (index, baseMs = 55, offsetMs = 70) => ({
  animationDelay: `${offsetMs + index * baseMs}ms`
});

/** Brief duration helpers for JS timers aligned with CSS motion tokens. */
export const MOTION = {
  fast: 140,
  normal: 280,
  slow: 480,
  decorFlash: 720,
  stackSettle: 520
};

export const motionClasses = {
  enter: "motion-enter",
  enterSlide: "motion-enter-slide",
  toast: "motion-toast",
  stackBlockNew: "stack-tower-block--new",
  decorFlash: "cozy-slot--flash",
  placementFlash: "room-placement--flash",
  upgradeCelebrate: "tier-upgrade-card--celebrate"
};
