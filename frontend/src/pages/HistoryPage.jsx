import { FeedbackRegion } from "../components/FeedbackRegion.jsx";
import { TaskCard } from "../components/TaskCard.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { formatCompactFocusTime } from "../utils/sessionStats.js";

export function HistoryPage({
  historyTasks,
  sessionStats,
  inventory,
  grid,
  error,
  offline,
  reward,
  loading,
  mutating,
  loadAll,
  setSelectedTask,
  completeTask,
  abandonTask,
  userPreferences,
  onNavigate
}) {
  const { t } = useLanguage();
  const completed = historyTasks.filter((task) => task.status === "COMPLETED");
  const abandoned = historyTasks.filter((task) => task.status === "ABANDONED");
  const totalFocusSeconds = sessionStats.totalFocusSecondsCompleted;
  const placedCount = grid?.cells.length ?? 0;
  const bricks = inventory?.resources.bricks ?? 0;
  const level = inventory?.level ?? 0;
  const totalFinished = completed.length + abandoned.length;
  const completionRate =
    totalFinished > 0 ? Math.round((completed.length / totalFinished) * 100) : 0;

  return (
    <div className="page page-history">
      <header className="history-hero">
        <h1 className="section-title">{t("history.title")}</h1>
        <p className="section-lead">{t("history.lead")}</p>
        <button
          type="button"
          className="btn btn-ghost btn-icon refresh-btn-inline"
          onClick={() => void loadAll(true)}
          disabled={loading || mutating}
          aria-label={t("history.refreshAria")}
        >
          ↻
        </button>
      </header>

      <FeedbackRegion
        error={error}
        offline={offline}
        reward={reward}
        loading={loading}
        mutating={mutating}
        activeView="history"
        onNavigate={onNavigate}
      />

      <div className="history-stats">
        <article className="history-stat">
          <p className="history-stat-label">{t("common.completed")}</p>
          <p className="history-stat-value">{completed.length}</p>
        </article>
        <article className="history-stat">
          <p className="history-stat-label">{t("labels.status.abandoned")}</p>
          <p className="history-stat-value">{abandoned.length}</p>
        </article>
        <article className="history-stat">
          <p className="history-stat-label">{t("history.focusTime")}</p>
          <p className="history-stat-value">{formatCompactFocusTime(totalFocusSeconds)}</p>
        </article>
      </div>

      <div className="history-progress-stats">
        <article className="history-progress-stat">
          <span className="history-progress-icon" aria-hidden>
            ✨
          </span>
          <div>
            <p className="history-progress-label">{t("common.level")}</p>
            <p className="history-progress-value">{level}</p>
          </div>
        </article>
        <article className="history-progress-stat">
          <span className="history-progress-icon" aria-hidden>
            🧱
          </span>
          <div>
            <p className="history-progress-label">{t("history.bricksOnHand")}</p>
            <p className="history-progress-value">{bricks}</p>
          </div>
        </article>
        <article className="history-progress-stat">
          <span className="history-progress-icon" aria-hidden>
            🏠
          </span>
          <div>
            <p className="history-progress-label">{t("history.homeBuilt")}</p>
            <p className="history-progress-value">{placedCount}/25</p>
          </div>
        </article>
        <article className="history-progress-stat">
          <span className="history-progress-icon" aria-hidden>
            📈
          </span>
          <div>
            <p className="history-progress-label">{t("history.completionRate")}</p>
            <p className="history-progress-value">{completionRate}%</p>
          </div>
        </article>
      </div>

      <section className="card task-list-section">
        <h2 className="section-title">{t("history.completedSessions")}</h2>
        <p className="section-lead">{t("history.completedLead", { count: completed.length })}</p>
        <div className="task-list">
          {completed.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              selected={false}
              isPending={mutating}
              calendarEnabled={userPreferences?.calendarEnabled ?? true}
              onSelect={setSelectedTask}
              onComplete={completeTask}
              onAbandon={abandonTask}
            />
          ))}
          {completed.length === 0 && !loading && (
            <p className="empty-state">{t("history.completedEmpty")}</p>
          )}
        </div>
      </section>

      <section className="card task-list-section history-abandoned-section">
        <h2 className="section-title">{t("history.abandonedSessions")}</h2>
        <p className="section-lead">{t("history.abandonedLead", { count: abandoned.length })}</p>
        <div className="task-list">
          {abandoned.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              selected={false}
              isPending={mutating}
              calendarEnabled={userPreferences?.calendarEnabled ?? true}
              onSelect={setSelectedTask}
              onComplete={completeTask}
              onAbandon={abandonTask}
            />
          ))}
          {abandoned.length === 0 && !loading && (
            <p className="empty-state">{t("history.abandonedEmpty")}</p>
          )}
        </div>
      </section>
    </div>
  );
}
