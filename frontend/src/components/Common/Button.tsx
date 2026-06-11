import { ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm",
  secondary:
    "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 dark:bg-stone-800 dark:text-stone-100 dark:border-stone-700 dark:hover:bg-stone-700",
  ghost:
    "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
};

// Visual sizes stay compact; min-h-[44px] guarantees a 44px touch target on
// mobile (WCAG 2.5.5 / Apple HIG), released on sm+ where the pointer is precise.
const sizes: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 rounded-lg gap-1.5 min-h-[44px] sm:min-h-0",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2 min-h-[44px] sm:min-h-0",
  lg: "text-base px-5 py-3 rounded-xl gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner size={size === "lg" ? 20 : 16} />}
      {children}
    </button>
  );
}
