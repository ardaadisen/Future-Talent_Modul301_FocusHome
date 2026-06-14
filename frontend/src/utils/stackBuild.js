/** Forgiving alignment tolerance in normalized lane coordinates (0–1). */
export const STACK_ALIGN_TOLERANCE = 0.14;

export const STACK_BLOCK_HEIGHT = 52;
export const STACK_FOUNDATION_HEIGHT = 52;
export const STACK_COLUMN_PADDING_TOP = 20;
export const STACK_VIEWPORT_HEIGHT = 320;


export const getReferencePosition = (blocks) =>
  blocks.length === 0 ? 0.5 : (blocks[blocks.length - 1]?.x ?? 0.5);

export const isStackAligned = (droppedX, referenceX) =>
  Math.abs(droppedX - referenceX) <= STACK_ALIGN_TOLERANCE;

export const clampLanePosition = (normalizedX) =>
  Math.max(0.09, Math.min(0.91, normalizedX));

export const positionToPercent = (x) => x * 100;

export const getPlacedBlockBottom = (index) =>
  STACK_FOUNDATION_HEIGHT + index * STACK_BLOCK_HEIGHT;

export const getMoverBottom = (placedCount) =>
  STACK_FOUNDATION_HEIGHT + placedCount * STACK_BLOCK_HEIGHT;

export const getStackColumnMinHeight = (placedCount) =>
  STACK_COLUMN_PADDING_TOP +
  STACK_FOUNDATION_HEIGHT +
  (placedCount + 1) * STACK_BLOCK_HEIGHT +
  16;

export const createInitialPlacedBlocks = (count) =>
  Array.from({ length: count }, () => ({ x: 0.5 }));

export const toPlacedBlocksFromPositions = (positions) =>
  positions.map((x) => ({ x }));
