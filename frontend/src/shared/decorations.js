

import { getSlotDefaultSizeClass, getSlotDefaultZone } from "./decorationZones.js";

const TIER_ORDER= ["SHACK", "CABIN", "APARTMENT", "VILLA", "PLAZA", "RESIDENCE"];

export const DECORATION_SLOT_KEYS= [
  "bed",
  "desk",
  "plant",
  "lamp",
  "wallDecor"
];

export const DECORATION_SLOT_LABELS= {
  bed: "Bed",
  desk: "Desk",
  plant: "Plant",
  lamp: "Lamp",
  wallDecor: "Wall decor"
};


export const DECORATION_CATALOG= [
  {
    id: "bed_simple",
    slot: "bed",
    category: "bed",
    label: "Simple bed",
    emoji: "🛏️",
    unlockTier: "SHACK",
    allowedZones: ["bedZone"],
    defaultZone: "bedZone",
    sizeClass: "lg"
  },
  {
    id: "bed_plaid",
    slot: "bed",
    category: "bed",
    label: "Plaid quilt",
    emoji: "🛌",
    unlockTier: "CABIN",
    allowedZones: ["bedZone"],
    defaultZone: "bedZone",
    sizeClass: "lg"
  },
  {
    id: "bed_canopy",
    slot: "bed",
    category: "bed",
    label: "Canopy bed",
    emoji: "👑",
    unlockTier: "VILLA",
    allowedZones: ["bedZone"],
    defaultZone: "bedZone",
    sizeClass: "lg"
  },
  {
    id: "desk_stool",
    slot: "desk",
    category: "desk",
    label: "Study stool",
    emoji: "🪑",
    unlockTier: "SHACK",
    allowedZones: ["deskZone"],
    defaultZone: "deskZone",
    sizeClass: "md"
  },
  {
    id: "desk_oak",
    slot: "desk",
    category: "desk",
    label: "Oak desk",
    emoji: "📝",
    unlockTier: "APARTMENT",
    allowedZones: ["deskZone"],
    defaultZone: "deskZone",
    sizeClass: "lg"
  },
  {
    id: "desk_library",
    slot: "desk",
    category: "desk",
    label: "Library desk",
    emoji: "📚",
    unlockTier: "RESIDENCE",
    allowedZones: ["deskZone"],
    defaultZone: "deskZone",
    sizeClass: "lg"
  },
  {
    id: "plant_pothos",
    slot: "plant",
    category: "plant",
    label: "Pothos vine",
    emoji: "🪴",
    unlockTier: "SHACK",
    allowedZones: ["plantZone"],
    defaultZone: "plantZone",
    sizeClass: "md"
  },
  {
    id: "plant_fern",
    slot: "plant",
    category: "plant",
    label: "Fern corner",
    emoji: "🌿",
    unlockTier: "CABIN",
    allowedZones: ["plantZone"],
    defaultZone: "plantZone",
    sizeClass: "md"
  },
  {
    id: "plant_bonsai",
    slot: "plant",
    category: "plant",
    label: "Bonsai tree",
    emoji: "🎋",
    unlockTier: "PLAZA",
    allowedZones: ["plantZone"],
    defaultZone: "plantZone",
    sizeClass: "sm"
  },
  {
    id: "lamp_warm",
    slot: "lamp",
    category: "lamp",
    label: "Warm lamp",
    emoji: "💡",
    unlockTier: "SHACK",
    allowedZones: ["lampZone", "bedZone"],
    defaultZone: "lampZone",
    sizeClass: "sm"
  },
  {
    id: "lamp_study",
    slot: "lamp",
    category: "lamp",
    label: "Study lamp",
    emoji: "🔦",
    unlockTier: "APARTMENT",
    allowedZones: ["lampZone", "deskZone"],
    defaultZone: "deskZone",
    sizeClass: "sm"
  },
  {
    id: "lamp_firefly",
    slot: "lamp",
    category: "lamp",
    label: "Firefly lantern",
    emoji: "🏮",
    unlockTier: "VILLA",
    allowedZones: ["lampZone", "bedZone"],
    defaultZone: "lampZone",
    sizeClass: "sm"
  },
  {
    id: "wall_frame",
    slot: "wallDecor",
    category: "wallDecor",
    label: "Photo frame",
    emoji: "🖼️",
    unlockTier: "SHACK",
    allowedZones: ["wallDecorZone"],
    defaultZone: "wallDecorZone",
    sizeClass: "md"
  },
  {
    id: "wall_clock",
    slot: "wallDecor",
    category: "clock",
    label: "Cottage clock",
    emoji: "🕰️",
    unlockTier: "CABIN",
    allowedZones: ["clockZone", "wallDecorZone"],
    defaultZone: "clockZone",
    sizeClass: "sm"
  },
  {
    id: "wall_tapestry",
    slot: "wallDecor",
    category: "wallDecor",
    label: "Woven tapestry",
    emoji: "🧵",
    unlockTier: "VILLA",
    allowedZones: ["wallDecorZone"],
    defaultZone: "wallDecorZone",
    sizeClass: "lg"
  }
];

export const getTierIndex = (tier) => TIER_ORDER.indexOf(tier);

export const isTierAtLeast = (current, required) =>
  getTierIndex(current) >= getTierIndex(required);

export const getDecorationById = (id) =>
  DECORATION_CATALOG.find((item) => item.id === id);

export const getDecorationIdsForTier = (tier) =>
  DECORATION_CATALOG.filter((item) => isTierAtLeast(tier, item.unlockTier)).map((item) => item.id);

export const getStarterUnlockedDecorationIds = () => getDecorationIdsForTier("SHACK");

export const getNewUnlockIdsForTier = (tier, alreadyUnlocked) =>
  getDecorationIdsForTier(tier).filter((id) => !alreadyUnlocked.includes(id));

export const getDecorationsForSlot = (slot, unlockedIds) =>
  DECORATION_CATALOG.filter((item) => item.slot === slot && unlockedIds.includes(item.id));

export const getDecorationsForSlotZone = (
  slot,
  unlockedIds,
  zone = getSlotDefaultZone(slot),
) =>
  getDecorationsForSlot(slot, unlockedIds).filter((item) => item.allowedZones.includes(zone));

export const isDecorationValidForZone = (item, zone) =>
  item.allowedZones.includes(zone);

export const getRenderZoneForSlot = (
  slot,
  decorationId
) => {
  if (decorationId) {
    const item = getDecorationById(decorationId);
    if (item) return item.defaultZone;
  }
  return getSlotDefaultZone(slot);
};

export const getSizeClassForSlot = (
  slot,
  decorationId
) => {
  if (decorationId) {
    const item = getDecorationById(decorationId);
    if (item) return item.sizeClass;
  }
  return getSlotDefaultSizeClass(slot);
};

export const isDecorationSlotKey = (value) =>
  DECORATION_SLOT_KEYS.includes(value);
