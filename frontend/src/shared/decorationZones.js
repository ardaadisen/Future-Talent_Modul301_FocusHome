



export const DECORATION_ZONE_KEYS= [
  "bedZone",
  "deskZone",
  "plantZone",
  "lampZone",
  "wallDecorZone",
  "clockZone",
  "windowZone",
  "rugZone"
];

export const ZONE_LABELS= {
  bedZone: "Rest corner",
  deskZone: "Focus nook",
  plantZone: "Floor corner",
  lampZone: "Beside bed",
  wallDecorZone: "Wall display",
  clockZone: "Wall clock",
  windowZone: "Window wall",
  rugZone: "Floor center"
};

export const ZONE_SURFACE= {
  bedZone: "floor",
  deskZone: "floor",
  plantZone: "floor",
  lampZone: "floor",
  wallDecorZone: "wall",
  clockZone: "wall",
  windowZone: "wall",
  rugZone: "floor"
};

/** Backend decoration slots map to a primary semantic zone for empty placeholders. */
export const SLOT_DEFAULT_ZONE= {
  bed: "bedZone",
  desk: "deskZone",
  plant: "plantZone",
  lamp: "lampZone",
  wallDecor: "wallDecorZone"
};

export const SLOT_DEFAULT_SIZE= {
  bed: "lg",
  desk: "lg",
  plant: "md",
  lamp: "sm",
  wallDecor: "md"
};

export const SLOT_ZONE_HINTS= {
  bed: "Floor · lower-left rest corner",
  desk: "Floor · lower-right focus nook",
  plant: "Floor · cozy corner spot",
  lamp: "Floor · warm light beside bed",
  wallDecor: "Wall · display area"
};

export const getSlotDefaultZone = (slot) =>
  SLOT_DEFAULT_ZONE[slot];

export const getSlotDefaultSizeClass = (slot) =>
  SLOT_DEFAULT_SIZE[slot];
