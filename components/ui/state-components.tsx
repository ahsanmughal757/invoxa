import { AlertCircle, CheckCircle2, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  message?: string;
  size?: "default" | "large";
  blocks?: number;
}

export function LoadingState({
  message = "Loading...",
  size = "default",
  blocks = 3,
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        size === "large" ? "min-h-[60vh]" : "py-10"
      }`}
    >
      <div className="w-full max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Skeleton className="h-4 w-4 rounded-full" />
          {message}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: blocks }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    text: string;
    onClick: () => void;
  };
  secondaryAction?: {
    text: string;
    onClick: () => void;
  };
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        {icon || <PackageOpen className="h-8 w-8 text-muted-foreground" />}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="flex gap-2">
          {action && <Button onClick={action.onClick}>{action.text}</Button>}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.text}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
  icon?: React.ReactNode;
}

export function ErrorState({
  title,
  description,
  onRetry,
  icon,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        {icon || <AlertCircle className="h-8 w-8 text-destructive" />}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
        {description}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

interface SuccessStateProps {
  title: string;
  description?: string;
}

export function SuccessState({ title, description }: SuccessStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
        <CheckCircle2 className="h-8 w-8 text-success" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="max-w-md text-center text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

interface ReadyStateProps {
  children: React.ReactNode;
}

export function ReadyState({ children }: ReadyStateProps) {
  return <>{children}</>;
}