export const TIER_THEMES = {
  SHACK: {
    displayName: "Shack",
    shortDescription: "A humble starter shelter — rough wood, one small window, room for dreams.",
    mood: "humble",
    accent: "#a16207",
    accentSoft: "#fef3c7",
    wallTop: "#e8dcc8",
    wallBottom: "#c9b896",
    wallPattern:
      "repeating-linear-gradient(90deg, rgba(120, 83, 45, 0.06) 0, rgba(120, 83, 45, 0.06) 3px, transparent 3px, transparent 28px)",
    floor: "#a67c52",
    floorHighlight: "#8b6914",
    floorStyle: "rough-plank",
    windowGlass: "#9ec9e0",
    windowSky: "#b8ddf4",
    windowFrame: "#6b5344",
    windowStyle: "small-pane",
    glow: "rgba(255, 190, 100, 0.28)",
    rug: "#b8956a",
    trim: "#6b5344",
    decorElements: ["exposed-beam", "patch-wall"]
  },
  CABIN: {
    displayName: "Cabin",
    shortDescription: "A warm woodland cottage with timber walls and a soft hearth glow.",
    mood: "cozy",
    accent: "#b45309",
    accentSoft: "#ffedd5",
    wallTop: "#d4a574",
    wallBottom: "#a67c52",
    wallPattern:
      "repeating-linear-gradient(180deg, rgba(90, 55, 30, 0.12) 0, rgba(90, 55, 30, 0.12) 14px, transparent 14px, transparent 28px)",
    floor: "#7c5c3e",
    floorHighlight: "#5c4033",
    floorStyle: "cabin-wood",
    windowGlass: "#87ceeb",
    windowSky: "#a8d8f0",
    windowFrame: "#5c4033",
    windowStyle: "cottage",
    glow: "rgba(255, 160, 80, 0.38)",
    rug: "#c9956c",
    trim: "#5c4033",
    decorElements: ["stone-hearth", "timber-accent", "warm-sill"]
  },
  APARTMENT: {
    displayName: "Apartment",
    shortDescription: "A clean city apartment — neutral walls, urban light, modern simplicity.",
    mood: "modern",
    accent: "#0369a1",
    accentSoft: "#e0f2fe",
    wallTop: "#f4f4f5",
    wallBottom: "#e4e4e7",
    wallPattern:
      "linear-gradient(180deg, transparent 88%, rgba(161, 161, 170, 0.25) 88%, rgba(161, 161, 170, 0.25) 90%, transparent 90%)",
    floor: "#d4d4d8",
    floorHighlight: "#a1a1aa",
    floorStyle: "laminate",
    windowGlass: "#bae6fd",
    windowSky: "#7dd3fc",
    windowFrame: "#71717a",
    windowStyle: "city-panel",
    glow: "rgba(125, 211, 252, 0.22)",
    rug: "#a8a29e",
    trim: "#71717a",
    decorElements: ["city-sill", "brick-stripe", "radiator"]
  },
  VILLA: {
    displayName: "Villa",
    shortDescription: "An airy premium villa — bright spaces, marble hints, and garden light.",
    mood: "premium",
    accent: "#047857",
    accentSoft: "#d1fae5",
    wallTop: "#fffef9",
    wallBottom: "#f5f0e6",
    wallPattern:
      "linear-gradient(180deg, transparent 72%, rgba(4, 120, 87, 0.08) 72%, rgba(4, 120, 87, 0.08) 74%, transparent 74%)",
    floor: "#e7e5e4",
    floorHighlight: "#d6d3d1",
    floorStyle: "marble",
    windowGlass: "#a5f3fc",
    windowSky: "#cffafe",
    windowFrame: "#78716c",
    windowStyle: "wide-bright",
    glow: "rgba(255, 230, 180, 0.42)",
    rug: "#d6b48a",
    trim: "#78716c",
    decorElements: ["column", "sun-wash", "wainscot"]
  },
  PLAZA: {
    displayName: "Plaza",
    shortDescription: "A sleek tower suite — floor-to-ceiling glass and polished corporate calm.",
    mood: "corporate",
    accent: "#6d28d9",
    accentSoft: "#ede9fe",
    wallTop: "#f8fafc",
    wallBottom: "#e2e8f0",
    wallPattern:
      "repeating-linear-gradient(90deg, rgba(109, 40, 217, 0.04) 0, rgba(109, 40, 217, 0.04) 1px, transparent 1px, transparent 48px)",
    floor: "#64748b",
    floorHighlight: "#475569",
    floorStyle: "polished-stone",
    windowGlass: "#93c5fd",
    windowSky: "#60a5fa",
    windowFrame: "#334155",
    windowStyle: "tower-glass",
    glow: "rgba(147, 197, 253, 0.25)",
    rug: "#94a3b8",
    trim: "#334155",
    decorElements: ["tower-lines", "glass-tower", "city-glow"]
  },
  RESIDENCE: {
    displayName: "Residence",
    shortDescription: "A penthouse residence — panoramic night views and refined luxury.",
    mood: "luxury",
    accent: "#be123c",
    accentSoft: "#ffe4e6",
    wallTop: "#fafaf9",
    wallBottom: "#292524",
    wallPattern: "linear-gradient(180deg, transparent 55%, rgba(41, 37, 36, 0.95) 55%)",
    floor: "#44403c",
    floorHighlight: "#292524",
    floorStyle: "dark-luxury",
    windowGlass: "#1e293b",
    windowSky: "#0f172a",
    windowFrame: "#1c1917",
    windowStyle: "panorama",
    glow: "rgba(251, 113, 133, 0.18)",
    rug: "#57534e",
    trim: "#1c1917",
    decorElements: ["skyline", "panorama-frame", "ambient-lights"]
  }
};

export const getTierTheme = (tier) => TIER_THEMES[tier] ?? TIER_THEMES.SHACK;

export const getTierThemeStyles = (tier) => ({
  "--tier-accent": getTierTheme(tier).accent,
  "--tier-accent-soft": getTierTheme(tier).accentSoft,
  "--room-wall-top": getTierTheme(tier).wallTop,
  "--room-wall-bottom": getTierTheme(tier).wallBottom,
  "--room-wall-pattern": getTierTheme(tier).wallPattern,
  "--room-floor": getTierTheme(tier).floor,
  "--room-floor-highlight": getTierTheme(tier).floorHighlight,
  "--room-window": getTierTheme(tier).windowGlass,
  "--room-window-sky": getTierTheme(tier).windowSky,
  "--room-trim": getTierTheme(tier).trim,
  "--room-window-frame": getTierTheme(tier).windowFrame,
  "--room-glow": getTierTheme(tier).glow,
  "--room-rug": getTierTheme(tier).rug,
});

export const ROOM_THEME = Object.fromEntries(
  Object.keys(TIER_THEMES).map((tier) => {
    const t = TIER_THEMES[tier];
    return [
      tier,
      {
        wallTop: t.wallTop,
        wallBottom: t.wallBottom,
        floor: t.floor,
        rug: t.rug,
        window: t.windowGlass,
        trim: t.trim,
        glow: t.glow,
      },
    ];
  }),
);

export { SLOT_ZONE_HINTS as SLOT_SCENE_HINTS } from "../shared/decorationZones.js";
