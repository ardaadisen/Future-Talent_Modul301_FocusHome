import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLanguage } from "../context/LanguageContext.jsx";
import { blocksReadyLabel } from "../i18n/labels.js";
import { TIER_THEME } from "../utils/homeTiers.js";
import { MOTION, motionClasses } from "../utils/motion.js";
import { clampLanePosition, createInitialPlacedBlocks, getMoverBottom, getPlacedBlockBottom, getReferencePosition, getStackColumnMinHeight, isStackAligned, positionToPercent, STACK_BLOCK_HEIGHT, STACK_VIEWPORT_HEIGHT } from "../utils/stackBuild.js";

const MOVE_SPEED = 0.014;

export function StackBuildMode({
  activeHome,
  bricks,
  isPending = false,
  highlighted = false,
  onPlace
}) {
  const { t } = useLanguage();
  const [moverX, setMoverX] = useState(0.5);
  const directionRef = useRef(1);
  const [dropState, setDropState] = useState("idle");
  const [feedbackKey, setFeedbackKey] = useState(null);
  const [isDropping, setIsDropping] = useState(false);
  const [placedBlocks, setPlacedBlocks] = useState([]);
  const [newBlockIndex, setNewBlockIndex] = useState(null);

  const viewportRef = useRef(null);
  const moverRef = useRef(null);
  const placementGuardRef = useRef(false);
  const lastDroppedXRef = useRef(0.5);

  const tier = activeHome?.currentTier ?? "SHACK";
  const stackProgress = activeHome?.stackProgress ?? 0;
  const stackTarget = activeHome?.stackTarget ?? 1;
  const isComplete = stackProgress >= stackTarget;
  const theme = TIER_THEME[tier];

  const referenceX = useMemo(() => getReferencePosition(placedBlocks), [placedBlocks]);
  const moverBottom = getMoverBottom(placedBlocks.length);
  const columnMinHeight = getStackColumnMinHeight(placedBlocks.length);

  useEffect(() => {
    setPlacedBlocks(createInitialPlacedBlocks(stackProgress));
    setNewBlockIndex(null);
    lastDroppedXRef.current = 0.5;
  }, [activeHome?.userId, activeHome?.currentTier]);

  useEffect(() => {
    setPlacedBlocks((current) => {
      if (current.length === stackProgress) return current;
      if (current.length > stackProgress) return current.slice(0, stackProgress);
      const blocks = createInitialPlacedBlocks(stackProgress);
      if (blocks.length > 0) {
        blocks[blocks.length - 1] = { x: lastDroppedXRef.current };
      }
      return blocks;
    });
    if (stackProgress > 0) {
      setNewBlockIndex(stackProgress - 1);
    }
  }, [stackProgress]);

  useEffect(() => {
    if (isPending || isDropping || isComplete) return;

    let frame = 0;
    const tick = () => {
      setMoverX((current) => {
        let next = current + directionRef.current * MOVE_SPEED;
        if (next >= 0.91) {
          next = 0.91;
          directionRef.current = -1;
        } else if (next <= 0.09) {
          next = 0.09;
          directionRef.current = 1;
        }
        return next;
      });
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [isComplete, isDropping, isPending]);

  useEffect(() => {
    if (!feedbackKey) return;
    const timer = window.setTimeout(() => setFeedbackKey(null), 2600);
    return () => window.clearTimeout(timer);
  }, [feedbackKey]);

  useEffect(() => {
    if (dropState === "idle") return;
    const timer = window.setTimeout(() => setDropState("idle"), dropState === "success" ? 520 : 720);
    return () => window.clearTimeout(timer);
  }, [dropState]);

  useEffect(() => {
    if (newBlockIndex === null) return;
    const timer = window.setTimeout(() => setNewBlockIndex(null), MOTION.stackSettle);
    return () => window.clearTimeout(timer);
  }, [newBlockIndex]);

  const scrollToMover = useCallback(() => {
    const viewport = viewportRef.current;
    const mover = moverRef.current;
    if (!viewport || !mover) return;

    requestAnimationFrame(() => {
      const viewportRect = viewport.getBoundingClientRect();
      const moverRect = mover.getBoundingClientRect();
      const moverTopInViewport = moverRect.top - viewportRect.top;

      if (moverTopInViewport < 48 || moverTopInViewport > viewportRect.height - STACK_BLOCK_HEIGHT - 24) {
        mover.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
  }, []);

  useEffect(() => {
    if (placedBlocks.length === 0) {
      viewportRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    scrollToMover();
  }, [placedBlocks.length, scrollToMover]);

  const handleDrop = useCallback(async () => {
    if (isPending || isDropping || isComplete || !activeHome || placementGuardRef.current) return;

    if (bricks < 1) {
      setFeedbackKey("build.earnBlocks");
      setDropState("miss");
      return;
    }

    const droppedX = clampLanePosition(moverX);

    if (!isStackAligned(droppedX, referenceX)) {
      setFeedbackKey("build.missedStack");
      setDropState("miss");
      return;
    }

    placementGuardRef.current = true;
    setIsDropping(true);
    try {
      const result = await onPlace();
      await new Promise((resolve) => window.setTimeout(resolve, MOTION.fast + 40));
      if (!result.tierUpgraded) {
        lastDroppedXRef.current = droppedX;
      }
      setDropState("success");
      setFeedbackKey(result.tierUpgraded ? "build.tierUpgrading" : "build.stackedSuccess");
    } catch {
      setDropState("miss");
      setFeedbackKey("build.placeFailed");
    } finally {
      setIsDropping(false);
      placementGuardRef.current = false;
    }
  }, [
    activeHome,
    bricks,
    isComplete,
    isDropping,
    isPending,
    moverX,
    onPlace,
    referenceX
  ]);

  const feedback = feedbackKey ? t(feedbackKey) : null;

  return (
    <section
      className={`stack-build-mode stack-build-mode--${tier.toLowerCase()} ${highlighted ? "stack-build-mode--highlighted" : ""} ${dropState === "miss" ? "stack-build-mode--miss" : ""} ${dropState === "success" ? "stack-build-mode--success" : ""}`}
      aria-labelledby="stack-build-title"
      style={{
        "--stack-accent": theme.accent,
        "--stack-block-top": theme.blockTop,
        "--stack-block-bottom": theme.blockBottom,
        "--stack-sky": theme.sky,
        "--stack-block-height": `${STACK_BLOCK_HEIGHT}px`,
        "--stack-viewport-height": `${STACK_VIEWPORT_HEIGHT}px`,
      }}
    >
      <header className="stack-build-header">
        <div>
          <h2 className="stack-build-title" id="stack-build-title">
            {t("build.stackBuild")}
          </h2>
          <p className="stack-build-lead">{t("build.stackHint")}</p>
        </div>
        <div className="stack-build-meta">
          <span className="construction-meta-pill">
            {t("build.stacked", { current: stackProgress, target: stackTarget })}
          </span>
          <span className="construction-meta-pill construction-meta-bricks">
            {blocksReadyLabel(t, bricks)}
          </span>
        </div>
      </header>

      {feedback && (
        <p
          className={`stack-build-feedback ${dropState === "success" ? "stack-build-feedback-success" : "stack-build-feedback-miss"}`}
          role="status"
        >
          {feedback}
        </p>
      )}

      <button
        type="button"
        className="stack-build-stage"
        onClick={() => void handleDrop()}
        disabled={isPending || isDropping || isComplete}
        aria-label={t("build.dropBlock")}
      >
        <div className="stack-build-sky" aria-hidden />

        <div className="stack-build-viewport" ref={viewportRef}>
          <div
            className="stack-build-column"
            style={{ minHeight: columnMinHeight }}
            aria-hidden
          >
            <div className="stack-build-foundation">
              <span className="stack-foundation-plank" />
              <span className="stack-foundation-plank" />
              <span className="stack-foundation-plank" />
            </div>

            {placedBlocks.map((block, index) => (
              <div
                key={`${tier}-block-${index}`}
                className={`stack-placed-block ${index === newBlockIndex ? motionClasses.stackBlockNew : ""}`}
                style={{
                  left: `${positionToPercent(block.x)}%`,
                  bottom: `${getPlacedBlockBottom(index)}px`
                }}
              >
                <span className={`stack-block-shape stack-block-shape--placed stack-block-skin stack-block-skin--${tier.toLowerCase()}`} />
              </div>
            ))}

            {!isComplete && (
              <div
                className="stack-align-target"
                style={{
                  left: `${positionToPercent(referenceX)}%`,
                  bottom: `${getMoverBottom(placedBlocks.length) - 6}px`
                }}
                aria-hidden
              >
                <span className="stack-align-target-label">{t("common.target")}</span>
              </div>
            )}

            {!isComplete && !isDropping && (
              <div
                ref={moverRef}
                className={`stack-mover-block ${dropState === "miss" ? "stack-mover-block--miss" : ""}`}
                style={{
                  left: `${positionToPercent(moverX)}%`,
                  bottom: `${moverBottom}px`
                }}
                aria-hidden
              >
                <span className={`stack-block-shape stack-block-shape--active stack-block-skin stack-block-skin--${tier.toLowerCase()}`} />
              </div>
            )}

            {isDropping && (
              <div
                className="stack-mover-block stack-mover-block--dropping"
                style={{
                  left: `${positionToPercent(clampLanePosition(moverX))}%`,
                  bottom: `${moverBottom}px`
                }}
                aria-hidden
              >
                <span className={`stack-block-shape stack-block-shape--active stack-block-skin stack-block-skin--${tier.toLowerCase()}`} />
              </div>
            )}
          </div>
        </div>
      </button>

      <p className="stack-build-hint">
        {isComplete
          ? t("build.tierComplete")
          : bricks < 1
            ? t("build.noBlocksLeft")
            : t("build.dropHint")}
      </p>
    </section>
  );
}
