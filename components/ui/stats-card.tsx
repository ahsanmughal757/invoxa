import { cn } from "@/lib/utils";
import { Card } from "./card";

type Tone = "default" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<Tone, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  info: "text-info",
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  icon?: React.ReactNode;
  tone?: Tone;
  className?: string;
}

export function StatCard({
  label,
  value,
  sublabel,
  icon,
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("flex flex-col gap-1.5 p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div
        className={cn("text-2xl font-semibold tracking-tight", toneClasses[tone])}
      >
        {value}
      </div>
      {sublabel && (
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      )}
    </Card>
  );
}