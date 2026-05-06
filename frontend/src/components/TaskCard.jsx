import AppCard from "./AppCard";

export default function TaskCard({ task, onSelect }) {
  const statusClass = `badge badge-status-${task.status.toLowerCase()}`;
  const difficultyClass = `badge badge-difficulty-${task.difficulty.toLowerCase()}`;

  return (
    <AppCard>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <strong>{task.title}</strong>
        <div className="row">
          <span className={statusClass}>{task.status}</span>
          <span className={difficultyClass}>{task.difficulty}</span>
        </div>
      </div>
      <p className="muted">{task.description}</p>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <small>{task.durationMinutes} min</small>
        {onSelect ? <button type="button" className="button button-secondary" onClick={() => onSelect(task)}>Select</button> : null}
      </div>
    </AppCard>
  );
}
