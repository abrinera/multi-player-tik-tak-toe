import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "yellow" | "blue" | "coral" | "green" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  default: "bg-white text-black",
  yellow: "bg-[var(--neo-yellow)] text-black",
  blue: "bg-[var(--neo-blue)] text-black",
  coral: "bg-[var(--neo-coral)] text-black",
  green: "bg-[var(--neo-green)] text-black",
  ghost: "bg-transparent text-black",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-6 py-3.5 text-lg",
};

export interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const NeoButton = React.forwardRef<HTMLButtonElement, NeoButtonProps>(
  ({ className, variant = "default", size = "md", disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-bold uppercase tracking-wide select-none",
        "border-[3px] border-black neo-shadow-sm transition-transform",
        "hover:-translate-x-[2px] hover:-translate-y-[2px] hover:[box-shadow:5px_5px_0_0_#000]",
        "active:translate-x-[3px] active:translate-y-[3px] active:[box-shadow:0_0_0_0_#000]",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--neo-blue)]",
        "disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
NeoButton.displayName = "NeoButton";
