import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";
import SectionHeader from "../components/SectionHeader";
import StatCard from "../components/StatCard";
import TaskCard from "../components/TaskCard";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function Dashboard({
  inventory,
  tasks,
  onGotoCreate,
  onGotoTimer,
  onSelectTask,
  onDeleteTask,
  backendHealth,
  deleteLoadingId,
  deleteError,
}) {
  const { t } = useLanguage();

  return (
    <div>
      <SectionHeader
        title={t("brand.name")}
        subtitle={t("scaffold.subtitle")}
      />

      <AppCard title={t("scaffold.backendStatus")}>
        {backendHealth?.state === "loading" ? (
          <p className="muted">{t("scaffold.checkingBackend")}</p>
        ) : null}
        {backendHealth?.state === "ok" ? (
          <p className="muted">{t("scaffold.connected")}</p>
        ) : null}
        {backendHealth?.state === "error" ? (
          <p className="text-danger">{backendHealth.message}</p>
        ) : null}
      </AppCard>

      <div className="stat-grid">
        <StatCard label={t("common.xp")} value={inventory.xp} />
        <StatCard label={t("common.level")} value={inventory.level} />
        <StatCard label={t("common.bricks")} value={inventory.bricks} />
        <StatCard label={t("scaffold.glassRoof")} value={`${inventory.glass} / ${inventory.roofTiles}`} />
      </div>

      <AppCard title={t("scaffold.quickActions")}>
        <div className="row">
          <AppButton onClick={onGotoCreate}>{t("scaffold.createTask")}</AppButton>
          <AppButton variant="secondary" onClick={onGotoTimer}>{t("scaffold.startFocus")}</AppButton>
        </div>
      </AppCard>

      <AppCard title={t("scaffold.focusTasks")}>
        {deleteError ? <p className="text-danger">{deleteError}</p> : null}
        {tasks.length === 0 ? (
          <p className="muted">{t("scaffold.noTasks")}</p>
        ) : (
          <div className="task-grid">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={onSelectTask}
                onDelete={onDeleteTask}
                deleteLoading={deleteLoadingId === task.id}
              />
            ))}
          </div>
        )}
      </AppCard>
    </div>
  );
}
