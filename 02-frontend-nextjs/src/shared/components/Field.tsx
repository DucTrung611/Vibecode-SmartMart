import { InputHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Field({ label, error, id, className = "", ...rest }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-(--color-foreground)">
        {label}
      </label>
      <input
        id={id}
        className={`rounded-lg border px-4 py-3 text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-(--color-ring) ${
          error ? "border-(--color-destructive)" : "border-(--color-border)"
        } ${className}`}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-(--color-destructive)">
          {error}
        </p>
      )}
    </div>
  );
}
