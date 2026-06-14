import { getNextHomeTier } from "../shared/index.js";

/** Display labels for enums — API values stay EN, UI uses t(). */

const DIFFICULTY_KEYS = {
  EASY: "labels.difficulty.easy",
  MEDIUM: "labels.difficulty.medium",
  HARD: "labels.difficulty.hard",
};

const STATUS_KEYS = {
  PENDING: "labels.status.pending",
  ACTIVE: "labels.status.active",
  COMPLETED: "labels.status.completed",
  ABANDONED: "labels.status.abandoned",
  FAILED: "labels.status.failed",
};

const SOURCE_KEYS = {
  AI: "labels.source.ai",
  MANUAL: "labels.source.manual",
};

const SLOT_KEYS = {
  bed: "slot.bed",
  desk: "slot.desk",
  plant: "slot.plant",
  lamp: "slot.lamp",
  wallDecor: "slot.wallDecor",
  clock: "slot.clock",
};

export function difficultyLabel(t, level) {
  return t(DIFFICULTY_KEYS[level] || DIFFICULTY_KEYS.MEDIUM);
}

export function statusLabel(t, status) {
  return t(STATUS_KEYS[status] || status);
}

export function sourceLabel(t, source) {
  return t(SOURCE_KEYS[source] || SOURCE_KEYS.MANUAL);
}

export function tierLabel(t, tier) {
  if (!tier) return "";
  return t(`tier.${tier}.name`);
}

export function tierDescription(t, tier) {
  if (!tier) return "";
  return t(`tier.${tier}.description`);
}

export function tierMood(t, tier) {
  if (!tier) return "";
  return t(`tier.${tier}.mood`);
}

export function slotLabel(t, slot) {
  return t(SLOT_KEYS[slot] || slot);
}

export function decorationLabel(t, decoration) {
  if (!decoration?.id) return decoration?.label || "";
  const key = `decoration.${decoration.id}`;
  const translated = t(key);
  return translated === key ? decoration.label : translated;
}

export function nextTierLabel(t, tier) {
  const next = getNextHomeTier(tier);
  return next ? tierLabel(t, next) : null;
}

export function milestoneLabel(t, id) {
  if (!id) return "";
  return t(`milestone.${id}.label`);
}

export function milestoneTagline(t, id) {
  if (!id) return "";
  return t(`milestone.${id}.tagline`);
}

export function blocksReadyLabel(t, count) {
  return count === 1 ? t("common.blockReady", { count }) : t("common.blocksReady", { count });
}
