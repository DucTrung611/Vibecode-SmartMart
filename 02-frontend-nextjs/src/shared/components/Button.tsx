import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  isLoading?: boolean;
}

export function Button({
  variant = "primary",
  isLoading = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const base =
    "cursor-pointer rounded-lg px-6 py-3 font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-ring) focus-visible:ring-offset-2";
  const variants = {
    primary:
      "bg-(--color-accent) text-(--color-on-primary) hover:opacity-90 hover:-translate-y-px",
    secondary:
      "border-2 border-(--color-primary) text-(--color-primary) hover:bg-(--color-muted)",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? "Loading…" : children}
    </button>
  );
}
