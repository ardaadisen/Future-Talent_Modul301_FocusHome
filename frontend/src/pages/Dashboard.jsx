import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";
import SectionHeader from "../components/SectionHeader";
import StatCard from "../components/StatCard";
import TaskCard from "../components/TaskCard";

export default function Dashboard({ inventory, tasks, onGotoCreate, onGotoTimer, onSelectTask, backendHealth }) {
  return (
    <div>
      <SectionHeader
        title="FocusHome"
        subtitle="AI-assisted focus planning with rewards and home building."
      />

      <AppCard title="Backend status">
        {backendHealth?.state === "loading" ? (
          <p className="muted">Checking backend…</p>
        ) : null}
        {backendHealth?.state === "ok" ? (
          <p className="muted">
            Connected — <strong>{backendHealth.service || "ok"}</strong> at {backendHealth.baseUrl}
          </p>
        ) : null}
        {backendHealth?.state === "error" ? (
          <p className="text-danger">{backendHealth.message}</p>
        ) : null}
      </AppCard>

      <div className="stat-grid">
        <StatCard label="XP" value={inventory.xp} />
        <StatCard label="Level" value={inventory.level} />
        <StatCard label="Bricks" value={inventory.bricks} />
        <StatCard label="Glass / Roof" value={`${inventory.glass} / ${inventory.roofTiles}`} />
      </div>

      <AppCard title="Quick Actions">
        <div className="row">
          <AppButton onClick={onGotoCreate}>Create a Task</AppButton>
          <AppButton variant="secondary" onClick={onGotoTimer}>Start Focus</AppButton>
        </div>
      </AppCard>

      <AppCard title="Today's Focus Tasks">
        <div className="task-grid">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onSelect={onSelectTask} />
          ))}
        </div>
      </AppCard>
    </div>
  );
}
