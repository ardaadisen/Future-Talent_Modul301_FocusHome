import AppCard from "./AppCard";

export default function StatCard({ label, value }) {
  return (
    <AppCard>
      <div className="muted" style={{ fontSize: "0.8rem" }}>{label}</div>
      <strong style={{ fontSize: "1.1rem" }}>{value}</strong>
    </AppCard>
  );
}
