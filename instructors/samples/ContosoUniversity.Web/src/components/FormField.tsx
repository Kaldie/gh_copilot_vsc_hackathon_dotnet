import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}

export default function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  return (
    <div className="mb-5">
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400"
      >
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
