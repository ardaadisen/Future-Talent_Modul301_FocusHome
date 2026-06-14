import { AnimatedValue } from "./AnimatedValue.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { milestoneLabel, milestoneTagline } from "../i18n/labels.js";
import { getMilestoneProgress } from "../utils/homeMilestones.js";
import { XpLevelProgress } from "./XpLevelProgress.jsx";

export function HomeProgressSidebar({ inventory, placedCount, sessionStats }) {
  const { t } = useLanguage();
  const bricks = inventory?.resources.bricks ?? 0;
  const glass = inventory?.resources.glass ?? 0;
  const roofTiles = inventory?.resources.roofTiles ?? 0;
  const level = inventory?.level ?? 0;
  const milestone = getMilestoneProgress(placedCount);

  return (
    <aside className="home-progress-sidebar">
      <section className="home-sidebar-card home-sidebar-stats">
        <h2 className="home-sidebar-title">{t("home.yourProgress")}</h2>
        <div className="home-sidebar-stat-grid">
          <article className="home-sidebar-stat home-sidebar-stat-bricks">
            <span className="home-sidebar-stat-icon" aria-hidden>
              🧱
            </span>
            <div>
              <p className="home-sidebar-stat-label">{t("home.availableBricks")}</p>
              <p className="home-sidebar-stat-value">
                <AnimatedValue value={bricks} />
              </p>
            </div>
          </article>
          <article className="home-sidebar-stat">
            <span className="home-sidebar-stat-icon" aria-hidden>
              🏗
            </span>
            <div>
              <p className="home-sidebar-stat-label">{t("home.blocksPlaced")}</p>
              <p className="home-sidebar-stat-value">
                <AnimatedValue value={`${placedCount}/25`} />
              </p>
            </div>
          </article>
          <article className="home-sidebar-stat">
            <span className="home-sidebar-stat-icon" aria-hidden>
              ✅
            </span>
            <div>
              <p className="home-sidebar-stat-label">{t("home.sessionsDone")}</p>
              <p className="home-sidebar-stat-value">
                <AnimatedValue value={sessionStats.completedCount} />
              </p>
            </div>
          </article>
          <article className="home-sidebar-stat">
            <span className="home-sidebar-stat-icon" aria-hidden>
              ✨
            </span>
            <div>
              <p className="home-sidebar-stat-label">{t("common.level")}</p>
              <p className="home-sidebar-stat-value">
                <AnimatedValue value={level} />
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="home-sidebar-card home-sidebar-xp">
        <XpLevelProgress totalXp={inventory?.totalXp ?? 0} level={level} />
      </section>

      <section className="home-sidebar-card home-sidebar-next">
        <h2 className="home-sidebar-title">{t("home.nextMilestone")}</h2>
        {milestone.isComplete ? (
          <>
            <p className="home-sidebar-next-label">{t("home.homeComplete")}</p>
            <p className="home-sidebar-next-hint">{t("home.homeCompleteLead")}</p>
          </>
        ) : milestone.next ? (
          <>
            <div className="home-sidebar-next-header">
              <span className="home-sidebar-next-icon" aria-hidden>
                {milestone.next.icon}
              </span>
              <div>
                <p className="home-sidebar-next-label">{milestoneLabel(t, milestone.next.id)}</p>
                <p className="home-sidebar-next-hint">{milestoneTagline(t, milestone.next.id)}</p>
              </div>
            </div>
            <div
              className="home-sidebar-next-track"
              role="progressbar"
              aria-valuenow={Math.round(milestone.segmentProgress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t("home.towardMilestone", { milestone: milestoneLabel(t, milestone.next.id) })}
            >
              <div
                className="home-sidebar-next-fill"
                style={{ width: `${Math.round(milestone.segmentProgress * 100)}%` }}
              />
            </div>
            <p className="home-sidebar-next-count">
              {t("home.bricksForMilestone", {
                placed: placedCount,
                required: milestone.next.bricksRequired,
                milestone: milestoneLabel(t, milestone.next.id),
              })}
            </p>
          </>
        ) : null}
      </section>

      <section className="home-sidebar-card home-sidebar-materials">
        <h2 className="home-sidebar-title">{t("home.materials")}</h2>
        <ul className="home-material-list">
          <li>
            <span aria-hidden>🧱</span> {t("common.bricks")}{" "}
            <strong>
              <AnimatedValue value={bricks} />
            </strong>
          </li>
          <li>
            <span aria-hidden>🪟</span> {t("common.glass")}{" "}
            <strong>
              <AnimatedValue value={glass} />
            </strong>
          </li>
          <li>
            <span aria-hidden>🏠</span> {t("common.roofTiles")}{" "}
            <strong>
              <AnimatedValue value={roofTiles} />
            </strong>
          </li>
        </ul>
        {bricks === 0 && (
          <p className="home-sidebar-tip">{t("home.earnNextBrick")}</p>
        )}
      </section>
    </aside>
  );
}
