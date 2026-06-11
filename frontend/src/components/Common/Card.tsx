import { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card p-5", className)} {...rest}>
      {children}
    </div>
  );
}
