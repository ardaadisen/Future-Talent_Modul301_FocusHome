export default function AppButton({ children, variant = "primary", ...props }) {
  const { disabled } = props;
  return (
    <button
      type="button"
      className={`button ${variant === "primary" ? "button-primary" : ""} ${
        variant === "secondary" ? "button-secondary" : ""
      } ${variant === "danger" ? "button-danger" : ""} ${disabled ? "button-disabled" : ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
