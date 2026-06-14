

export function StatCard({ icon, label, value }) {
  return (
    <article className="card stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <p className="muted">{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
