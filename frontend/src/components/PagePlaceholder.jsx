

export function PagePlaceholder({ eyebrow, title, description, actions, children }) {
  return (
    <section className="page-placeholder card">
      {eyebrow && <p className="page-placeholder-eyebrow">{eyebrow}</p>}
      <h2 className="page-placeholder-title">{title}</h2>
      <p className="page-placeholder-description">{description}</p>
      {children}
      {actions && <div className="page-placeholder-actions">{actions}</div>}
    </section>
  );
}
