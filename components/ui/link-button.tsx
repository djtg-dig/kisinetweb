import type { AnchorHTMLAttributes } from "react";

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: "primary" | "secondary";
};

export function LinkButton({
  children,
  className = "",
  variant = "primary",
  ...props
}: LinkButtonProps) {
  const variants = {
    primary:
      "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-200",
    secondary:
      "border border-app-border bg-app-surface text-app-text hover:bg-primary-50 focus:ring-primary-100",
  };

  return (
    <a
      className={`inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
