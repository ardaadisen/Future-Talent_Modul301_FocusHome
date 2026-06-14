import { HOME_MILESTONES } from "../utils/homeMilestones.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { milestoneLabel } from "../i18n/labels.js";

export function HomeMilestoneTracker({ progress, placedCount }) {
  const { t } = useLanguage();

  return (
    <div className="home-milestone-tracker" aria-label={t("milestone.trackerAria")}>
      <ol className="home-milestone-steps">
        {HOME_MILESTONES.map((milestone, index) => {
          const isComplete = placedCount >= milestone.bricksRequired;
          const isActive = progress.next?.id === milestone.id;
          const isUpcoming = !isComplete && !isActive;

          return (
            <li
              key={milestone.id}
              className={`home-milestone-step ${isComplete ? "complete" : ""} ${isActive ? "active" : ""} ${isUpcoming ? "upcoming" : ""}`}
            >
              <div className="home-milestone-node" aria-hidden>
                <span className="home-milestone-icon">{isComplete ? "✓" : milestone.icon}</span>
              </div>
              <p className="home-milestone-label">{milestoneLabel(t, milestone.id)}</p>
              {index < HOME_MILESTONES.length - 1 && (
                <div className={`home-milestone-connector ${isComplete ? "filled" : ""}`} aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
