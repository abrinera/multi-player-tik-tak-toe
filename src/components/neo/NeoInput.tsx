import * as React from "react";
import { cn } from "@/lib/utils";

export const NeoInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full bg-white text-black font-semibold placeholder:text-black/50",
        "border-[3px] border-black neo-shadow-sm px-4 py-3 text-base",
        "focus:outline-none focus:ring-4 focus:ring-[var(--neo-blue)]",
        className,
      )}
      {...props}
    />
  ),
);
NeoInput.displayName = "NeoInput";
