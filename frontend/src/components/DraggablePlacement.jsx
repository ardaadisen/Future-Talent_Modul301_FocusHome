
import { getDecorationById } from "../shared/index.js";
import { useCallback, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { decorationLabel } from "../i18n/labels.js";
import { DecorationSprite } from "./DecorationSprite.jsx";
import { motionClasses } from "../utils/motion.js";
import { PlacementToolbar } from "./PlacementToolbar.jsx";


export function DraggablePlacement({
  placement,
  isSelected,
  isNew = false,
  isPending = false,
  roomRef,
  onSelect,
  onMoveCommit,
  onRotate,
  onDelete,
  onBringFront,
  onSendBack,
}) {
  const { t } = useLanguage();
  const decoration = getDecorationById(placement.decorationId);
  const [livePosition, setLivePosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);

  const x = livePosition?.x ?? placement.x;
  const y = livePosition?.y ?? placement.y;

  const handlePointerDown = (event) => {
    if (isPending) return;
    event.stopPropagation();
    onSelect(placement.placementId);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: placement.x,
      originY: placement.y,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = useCallback(
    (event) => {
      if (!isDragging || !dragRef.current || !roomRef.current) return;

      const rect = roomRef.current.getBoundingClientRect();
      const deltaX = ((event.clientX - dragRef.current.startX) / rect.width) * 100;
      const deltaY = ((event.clientY - dragRef.current.startY) / rect.height) * 100;
      const nextX = Math.max(4, Math.min(96, dragRef.current.originX + deltaX));
      const nextY = Math.max(4, Math.min(96, dragRef.current.originY + deltaY));
      setLivePosition({ x: nextX, y: nextY });
    },
    [isDragging, roomRef],
  );

  const handlePointerUp = (event) => {
    if (!isDragging) return;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (livePosition) {
      onMoveCommit(placement.placementId, livePosition.x, livePosition.y);
    }
    dragRef.current = null;
    setLivePosition(null);
  };

  if (!decoration) return null;

  return (
    <div
      className={`room-placement ${isSelected ? "room-placement--selected" : ""} ${isDragging ? "room-placement--dragging" : ""} ${isNew ? motionClasses.placementFlash : ""}`}
      onClick={(event) => event.stopPropagation()}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        zIndex: placement.zIndex ?? 1,
        transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
      }}
    >
      <button
        type="button"
        className="room-placement-body"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        disabled={isPending}
        aria-label={t("home.dragReposition", { label: decorationLabel(t, decoration) })}
        aria-pressed={isSelected}
      >
        <DecorationSprite decoration={decoration} sizeClass={decoration.sizeClass || "md"} />
        <span className="room-placement-label">{decorationLabel(t, decoration)}</span>
      </button>

      {isSelected && !isDragging && (
        <PlacementToolbar
          onRotate={() => onRotate(placement.placementId)}
          onDelete={() => onDelete(placement.placementId)}
          onBringFront={() => onBringFront(placement.placementId)}
          onSendBack={() => onSendBack(placement.placementId)}
          disabled={isPending}
        />
      )}
    </div>
  );
}
