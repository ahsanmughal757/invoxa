import { cn } from "@/lib/utils";

export type StatusTone =
  | "neutral"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "violet";

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground ring-muted",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20",
};

interface StatusBadgeProps {
  label: React.ReactNode;
  tone?: StatusTone;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({
  label,
  tone = "neutral",
  dot,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneClasses[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {label}
    </span>
  );
}