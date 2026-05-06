import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";
import SectionHeader from "../components/SectionHeader";
import StatCard from "../components/StatCard";
import TaskCard from "../components/TaskCard";

export default function Dashboard({ inventory, tasks, onGotoCreate, onGotoTimer, onSelectTask }) {
  return (
    <div>
      <SectionHeader
        title="FocusHome"
        subtitle="AI-assisted focus planning with rewards and home building."
      />

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
