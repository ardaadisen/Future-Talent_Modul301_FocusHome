/** CSS/SVG-style decorative furniture sprites (no emoji). */

const CATEGORY_VARIANTS = {
  bed: ["bed_simple", "bed_plaid", "bed_canopy"],
  desk: ["desk_stool", "desk_oak", "desk_library"],
  plant: ["plant_pothos", "plant_fern", "plant_bonsai"],
  lamp: ["lamp_warm", "lamp_study", "lamp_firefly"],
  wallDecor: ["wall_frame", "wall_tapestry"],
  clock: ["wall_clock"],
};

function variantIndex(decorationId, listLength) {
  if (!decorationId || listLength === 0) return 0;
  let hash = 0;
  for (let i = 0; i < decorationId.length; i += 1) {
    hash = (hash + decorationId.charCodeAt(i) * (i + 1)) % listLength;
  }
  return hash;
}

export function getDecorationSpriteKind(decoration) {
  const category = decoration?.category || decoration?.slot || "desk";
  const ids = CATEGORY_VARIANTS[category] || CATEGORY_VARIANTS.desk;
  const idx = variantIndex(decoration?.id, ids.length);
  return `${category}-${ids[idx]?.split("_").slice(1).join("-") || "default"}`;
}

export function DecorationSprite({ decoration, className = "", sizeClass = "md" }) {
  const kind = getDecorationSpriteKind(decoration);
  const category = decoration?.category || decoration?.slot || "desk";

  return (
    <span
      className={`deco-sprite deco-sprite--${category} deco-sprite--${kind} deco-sprite--${sizeClass} ${className}`.trim()}
      aria-hidden
    >
      <span className="deco-sprite-shadow" />
      <span className="deco-sprite-body" />
    </span>
  );
}
