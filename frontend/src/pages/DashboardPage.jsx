import { AiTaskForm } from "../components/AiTaskForm.jsx";
import { FeedbackRegion } from "../components/FeedbackRegion.jsx";
import { HeroSection } from "../components/HeroSection.jsx";
import { HomeProgressPreview } from "../components/HomeProgressPreview.jsx";
import { ManualTaskForm } from "../components/ManualTaskForm.jsx";
import { TaskCard } from "../components/TaskCard.jsx";
import { TimerPanel } from "../components/TimerPanel.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

export function DashboardPage({
  activeTasks,
  selectedTask,
  setSelectedTask,
  inventory,
  activeHome,
  error,
  offline,
  reward,
  loading,
  mutating,
  recentlyCompletedTaskId,
  sessionStats,
  userPreferences,
  loadAll,
  createManualTask,
  parseAiTask,
  confirmAiTask,
  startTask,
  deleteTask,
  completeTask,
  abandonTask,
  onNavigate
}) {
  const { t } = useLanguage();

  return (
    <div className="page page-focus dashboard-page">
      <HeroSection
        stats={sessionStats}
        onRefresh={() => void loadAll(true)}
        refreshing={loading || mutating}
      />

      <FeedbackRegion
        error={error}
        offline={offline}
        reward={reward}
        loading={loading}
        mutating={mutating}
        activeView="dashboard"
        onNavigate={onNavigate}
      />

      <section className="dashboard-layout zone-focus" aria-label={t("dashboard.workspaceAria")}>
        <div className="dashboard-main">
          <header className="dashboard-section-header">
            <h2 className="dashboard-section-title">{t("dashboard.planFocus")}</h2>
            <p className="dashboard-section-lead">{t("dashboard.planFocusLead")}</p>
          </header>

          <div className="creation-zone">
            <ManualTaskForm
              isPending={mutating}
              createManualTask={createManualTask}
              defaultFocusDurationSeconds={userPreferences?.defaultFocusDurationSeconds}
              calendarEnabled={userPreferences?.calendarEnabled ?? true}
            />
            <AiTaskForm
              isPending={mutating}
              calendarEnabled={userPreferences?.calendarEnabled ?? true}
              onParse={parseAiTask}
              onConfirm={confirmAiTask}
            />
          </div>

          <section className="card task-list-section">
            <h2 className="section-title">{t("dashboard.focusSessions")}</h2>
            <p className="section-lead">{t("dashboard.selectSession")}</p>
            <div className="task-list">
              {activeTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  selected={selectedTask?.id === task.id}
                  isPending={mutating}
                  celebrate={recentlyCompletedTaskId === task.id}
                  calendarEnabled={userPreferences?.calendarEnabled ?? true}
                  onSelect={setSelectedTask}
                  onComplete={completeTask}
                  onAbandon={abandonTask}
                  onDelete={deleteTask}
                />
              ))}
              {activeTasks.length === 0 && !loading && (
                <p className="empty-state">{t("dashboard.emptySessions")}</p>
              )}
            </div>
          </section>
        </div>

        <aside className="dashboard-aside">
          <TimerPanel
            isPending={mutating}
            task={selectedTask}
            pendingCount={sessionStats.pendingCount}
            onStart={startTask}
            onComplete={completeTask}
            onAbandon={abandonTask}
          />
          <HomeProgressPreview inventory={inventory} activeHome={activeHome} onNavigate={onNavigate} />
        </aside>
      </section>
    </div>
  );
}
