import { cn } from "../../utils/cn";
import { initials } from "../../utils/formatters";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, src, size = 36, className }: AvatarProps) {
  const dimension = { width: size, height: size, fontSize: size * 0.4 };
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={dimension}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }
  return (
    <div
      style={dimension}
      className={cn(
        "flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-200",
        className
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}
