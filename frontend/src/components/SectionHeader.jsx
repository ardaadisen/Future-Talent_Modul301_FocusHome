export default function SectionHeader({ title, subtitle }) {
  return (
    <header style={{ marginBottom: "0.8rem" }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      {subtitle ? <p className="muted" style={{ marginBottom: 0 }}>{subtitle}</p> : null}
    </header>
  );
}
