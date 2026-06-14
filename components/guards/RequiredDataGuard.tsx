"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

interface RequiredDataGuardProps {
  children: React.ReactNode;
  check: () => boolean;
  message: string;
  actionText: string;
  actionHref: string;
}

export function RequiredDataGuard({
  children,
  check,
  message,
  actionText,
  actionHref,
}: RequiredDataGuardProps) {
  const router = useRouter();

  if (!check()) {
    return (
      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Missing Information</AlertTitle>
        <AlertDescription>
          {message}
          <Button
            onClick={() => router.push(actionHref)}
            variant="outline"
            className="ml-2 mt-4"
          >
            {actionText}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
