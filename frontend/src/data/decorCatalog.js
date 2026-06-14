/** Decoration catalog — TODO: sync with backend asset/unlock API. */

export const DECOR_CATEGORIES = [
  { id: "bed", label: "Bed", icon: "🛏️" },
  { id: "desk", label: "Desk", icon: "🪑" },
  { id: "plant", label: "Plant", icon: "🪴" },
  { id: "lamp", label: "Lamp", icon: "💡" },
  { id: "wall", label: "Wall decor", icon: "🖼️" },
  { id: "clock", label: "Clock", icon: "🕰️" },
];

export const DECOR_ITEMS = [
  { id: "bed-cozy", category: "bed", label: "Cozy Bed", emoji: "🛏️", cost: 0 },
  { id: "bed-loft", category: "bed", label: "Loft Bed", emoji: "🛌", cost: 5 },
  { id: "desk-study", category: "desk", label: "Study Desk", emoji: "🪑", cost: 0 },
  { id: "desk-mini", category: "desk", label: "Mini Desk", emoji: "📚", cost: 3 },
  { id: "plant-fern", category: "plant", label: "Fern", emoji: "🪴", cost: 2 },
  { id: "plant-succulent", category: "plant", label: "Succulent", emoji: "🌿", cost: 1 },
  { id: "lamp-warm", category: "lamp", label: "Warm Lamp", emoji: "💡", cost: 2 },
  { id: "lamp-floor", category: "lamp", label: "Floor Lamp", emoji: "🏮", cost: 4 },
  { id: "wall-art", category: "wall", label: "Wall Art", emoji: "🖼️", cost: 2 },
  { id: "wall-shelf", category: "wall", label: "Shelf", emoji: "📦", cost: 3 },
  { id: "clock-round", category: "clock", label: "Round Clock", emoji: "🕰️", cost: 1 },
  { id: "clock-digital", category: "clock", label: "Focus Clock", emoji: "⏰", cost: 2 },
];
