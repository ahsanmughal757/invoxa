import { Loader2, AlertCircle, PackageOpen, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LoadingStateProps {
  message?: string;
  size?: "default" | "large";
}

export function LoadingState({ message = "Loading...", size = "default" }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${size === "large" ? "min-h-[60vh]" : "py-12"}`}>
      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
      <p className="text-gray-600">{message}</p>
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

export function EmptyState({ title, description, icon, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="bg-gray-100 p-4 rounded-full mb-4">
        {icon || <PackageOpen className="h-12 w-12 text-gray-400" />}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-center max-w-md mb-6">{description}</p>
      {action && (
        <div className="flex gap-2">
          <Button onClick={action.onClick}>{action.text}</Button>
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

export function ErrorState({ title, description, onRetry, icon }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="bg-red-100 p-4 rounded-full mb-4">
        {icon || <AlertCircle className="h-12 w-12 text-red-500" />}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-center max-w-md mb-6">{description}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
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