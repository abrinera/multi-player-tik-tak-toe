import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "white" | "yellow" | "blue" | "coral" | "green" | "pink" | "muted";
const tones: Record<Tone, string> = {
  white: "bg-white",
  yellow: "bg-[var(--neo-yellow)]",
  blue: "bg-[var(--neo-blue)]",
  coral: "bg-[var(--neo-coral)]",
  green: "bg-[var(--neo-green)]",
  pink: "bg-[var(--neo-pink)]",
  muted: "bg-[var(--muted)]",
};

export function NeoCard({
  tone = "white", className, ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: Tone }) {
  return (
    <div
      className={cn("border-[3px] border-black neo-shadow p-5 text-black", tones[tone], className)}
      {...props}
    />
  );
}
