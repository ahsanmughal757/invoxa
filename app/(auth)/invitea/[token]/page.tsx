// app/(auth)/invite/[token]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  getInviteByTokenAction,
  acceptInviteAction,
} from "@/lib/actions/invite.actions";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { orgId, orgRole } = useAuth();
  const { user } = useUser(); // Get user from useUser hook
  const clerk = useClerk();
  const [invite, setInvite] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.token) {
      // Using server action instead of API route
      getInviteByTokenAction(params.token as string)
        .then((result) => {
          if (!result.success) {
            setError(result.error || "Error getting invite details.");
          } else {
            setInvite(
              result.data && result?.data.invite ? result.data.invite : null,
            );
          }
        })
        .finally(() => setLoading(false));
    }
  }, [params.token]);

  const handleAccept = async () => {
    if (!user) {
      // User is not logged in, prompt them to sign up or sign in
      // After sign-up/in, Clerk will redirect back and this function can be re-attempted.
      clerk.openSignUp({ afterSignUpUrl: window.location.href });
      return;
    }

    // Using server action instead of API route
    try {
      const result = await acceptInviteAction(params.token as string);

      if (result.success) {
        alert("Invitation accepted! You are now part of the organization.");
        router.push("/dashboard");
      } else {
        throw new Error(result.error || "Failed to accept invitation.");
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Verifying invitation...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="mt-2">{error}</p>
        <Button onClick={() => router.push("/")} className="mt-4">
          Go Home
        </Button>
      </div>
    );
  }

  if (!invite) {
    return <div className="text-center py-10">No invitation found.</div>;
  }

  if (orgId === invite.organization.id) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">You are already a member!</h1>
        <p className="mt-2">
          You are already a part of {invite.organization.name}.
        </p>
        <Button onClick={() => router.push("/dashboard")} className="mt-4">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-10">
      <h1 className="text-2xl font-bold">You've been invited!</h1>
      <p className="mt-2">
        You have been invited to join the organization:{" "}
        <strong>{invite.organization.name}</strong>
      </p>
      <div className="mt-6">
        <Button size="lg" onClick={handleAccept}>
          Accept Invitation
        </Button>
      </div>
    </div>
  );
}
