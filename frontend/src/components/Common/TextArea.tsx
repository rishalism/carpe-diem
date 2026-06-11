import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "../../utils/cn";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const areaId = id ?? rest.name;
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={areaId}
            className="block text-sm font-medium text-stone-700 dark:text-stone-300"
          >
            {label}
          </label>
        )}
        <textarea
          id={areaId}
          ref={ref}
          className={cn("input-base resize-y leading-relaxed", className)}
          aria-invalid={!!error}
          {...rest}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
TextArea.displayName = "TextArea";
