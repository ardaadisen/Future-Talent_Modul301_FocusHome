import { useEffect, useRef, useState } from "react";


export function AnimatedValue({ value, className }) {
  const previousValue = useRef(value);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (previousValue.current === value) return;

    previousValue.current = value;
    setIsPulsing(true);
    const timer = window.setTimeout(() => setIsPulsing(false), 700);
    return () => window.clearTimeout(timer);
  }, [value]);

  return (
    <span className={["animated-value", isPulsing ? "animated-value--pulse" : "", className].filter(Boolean).join(" ")}>
      {value}
    </span>
  );
}
