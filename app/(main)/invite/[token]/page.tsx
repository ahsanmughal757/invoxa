"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  Mail,
  Calendar,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { createInfoNotification } from "@/lib/queries/notifications";
import { getDBUser } from "@/lib/queries/user";
import { getInviteByTokenAction, acceptInviteAction } from '@/lib/actions/invite.actions';

export default function InviteTokenPage() {
  const params = useParams();
  const router = useRouter();
  const { userId } = useAuth();
  const [invite, setInvite] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (params.token) {
      fetchInviteDetails(params.token as string);
    }
  }, [params.token]); // Removed invite from dependency array to prevent infinite re-renders

  const fetchInviteDetails = async (token: string) => {
    try {
      setLoading(true);
      // Using server action instead of API route
      const result = await getInviteByTokenAction(token);

      if (!result.success) {
        setError(result.error || "Error getting invite details.");
      } else {
        // Clean the invite object to remove any non-serializable properties
        const cleanedInvite = JSON.parse(JSON.stringify(result.data && result.data.invite));
        setInvite(cleanedInvite);
      }
    } catch (err: any) {
      console.error("Error fetching invite:", err.message);
      setError("Failed to fetch invitation details");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!userId) {
      setError("You must be logged in to accept an invitation");
      return;
    }

    setAccepting(true);
    try {
      // Using server action instead of API route
      const result = await acceptInviteAction(params.token as string);

      if (result.success) {
        toast.success("Invitation accepted successfully!");

        // Send notification to inviter that invite was accepted
        const userData = await getDBUser(userId, "clerk");

        if (userData && !error && invite.inviter_profile.email) {
          // Create a simplified version of the invite object for the notification
          const notificationData = {
            senderId: userData.id,
            recipientEmail: invite.inviter_profile.email,
            message: `Your invitation to join ${invite.organization?.name || 'an organization'} has been accepted by ${invite.email}.`,
          };

          try {
            await createInfoNotification(notificationData);
          } catch (notificationError) {
            console.error("Error creating notification:", notificationError);
            // Don't fail the entire operation if notification creation fails
          }
        }
        
        router.push("/dashboard");
      } else {
        setError(result.error || "Failed to accept invitation.");
        console.error("Error accepting invite:", result.error);
        // throw new Error(result.error || "Failed to accept invitation.");
      }
    } catch (e: any) {
      console.error("Error accepting invite:", e.message);
      setError(e.message);
      toast.error(e.message || "Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!userId) {
      setError("You must be logged in to reject an invitation");
      return;
    }

    setRejecting(true);
    try {
      // Using server action instead of API route
      const result = await import('@/lib/actions/invite.actions')
        .then(actions => actions.rejectInviteAction(params.token as string));

      if (result.success) {
        toast.success("Invitation rejected successfully");
        router.push("/dashboard");
      } else {
        throw new Error(result.error || "Failed to reject invitation.");
      }
    } catch (e: any) {
      console.error("Error rejecting invite:", e);
      setError(e.message);
      toast.error(e.message || "Failed to reject invitation");
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Verifying invitation...
          </h2>
          <p className="mt-2 text-gray-600">
            Checking the details of your invitation
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center text-red-600 flex items-center justify-center">
                <XCircle className="h-6 w-6 mr-2" />
                Invitation Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="mt-6">
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center text-gray-900">
                No Invitation Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600">
                The invitation link you followed is invalid or has expired.
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <UserPlus className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Organization Invitation
          </h1>
          <p className="mt-2 text-gray-600">
            You've been invited to join an organization
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Invitation Details</span>
              <Badge variant="secondary">
                {invite.status === "pending" ? (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </>
                ) : (
                  <>
                    {invite.status === "accepted" ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Accepted
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        {invite.status.charAt(0).toUpperCase() +
                          invite.status.slice(1)}
                      </>
                    )}
                  </>
                )}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <Building className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Organization
                  </h3>
                  <p className="text-sm text-gray-600">
                    {invite.organization?.name || "Unknown Organization"}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <UserPlus className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Invited by
                  </h3>
                  <p className="text-sm text-gray-600">
                    {invite.inviter_profile?.name || "Unknown User"}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Your email
                  </h3>
                  <p className="text-sm text-gray-600">{invite.email}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Expires on
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(invite.expires_at)}
                  </p>
                </div>
              </div>
            </div>

            {invite.status !== "pending" ? (
              <div className="pt-4">
                <Alert>
                  <AlertDescription>
                    This invitation has already been {invite.status}.
                    {invite.status === "accepted" &&
                      " You are now part of this organization."}
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full mt-4"
                >
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button
                  onClick={handleReject}
                  variant="outline"
                  className="flex-1"
                  disabled={rejecting}
                >
                  {rejecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Decline
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleAccept}
                  className="flex-1"
                  disabled={accepting}
                >
                  {accepting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Accept Invitation
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>If you didn't expect this invitation, you can safely ignore it.</p>
        </div>
      </div>
    </div>
  );
}