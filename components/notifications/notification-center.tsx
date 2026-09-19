"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { BackButton } from "@/components/ui/back-button";
import {
  Bell,
  Check,
  X,
  AlertCircle,
  DollarSign,
  Calendar,
  Settings,
  Loader2,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// Notification rows from the `notifications` table use `is_read` and `created_at`
interface AppNotification {
  id: string;
  message: string;
  is_read: boolean;
  created_at?: string;
  link?: string | null;
}

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => Promise<void> | void;
  onMarkAllAsRead: () => Promise<void> | void;
  onDeleteNotification: (id: string) => Promise<void> | void;
}

const typeTones: Record<string, { icon: React.ReactNode; card: string }> = {
  invoice_overdue: {
    icon: <AlertCircle className="h-5 w-5 text-destructive" />,
    card: "bg-destructive/5 border-destructive/20",
  },
  payment_received: {
    icon: <DollarSign className="h-5 w-5 text-success" />,
    card: "bg-success/5 border-success/20",
  },
  recurring_invoice: {
    icon: <Calendar className="h-5 w-5 text-info" />,
    card: "bg-info/5 border-info/20",
  },
  default: {
    icon: <Settings className="h-5 w-5 text-muted-foreground" />,
    card: "bg-card border-border",
  },
};

function toneFor(notification: AppNotification) {
  const message = notification.message.toLowerCase();
  if (message.includes("invitation")) {
    return typeTones.invoice_overdue;
  }
  if (message.includes("payment")) {
    return typeTones.payment_received;
  }
  if (message.includes("invoice")) {
    return typeTones.recurring_invoice;
  }
  return typeTones.default;
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});
  const [markAllPending, setMarkAllPending] = useState(false);
  const [deletePending, setDeletePending] = useState<Record<string, boolean>>(
    {},
  );

  const filteredNotifications = notifications.filter((notification) =>
    filter === "all" ? true : !notification.is_read,
  );

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    setPendingIds((prev) => ({ ...prev, [id]: true }));
    try {
      await onMarkAsRead(id);
      toast.success("Notification marked as read");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to mark notification as read",
      );
    } finally {
      setPendingIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkAllPending(true);
    try {
      await onMarkAllAsRead();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to mark all notifications as read",
      );
    } finally {
      setMarkAllPending(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletePending((prev) => ({ ...prev, [id]: true }));
    try {
      await onDeleteNotification(id);
      toast.success("Notification deleted");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete notification",
      );
    } finally {
      setDeletePending((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Notifications"
          description={
            unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You're all caught up"
          }
        />
        <div className="flex flex-wrap items-center gap-2">
          <BackButton href="/dashboard">Back to Dashboard</BackButton>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unread")}
        >
          Unread ({unreadCount})
        </Button>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllPending}
          >
            {markAllPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-2 h-4 w-4" />
            )}
            Mark All Read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {filter === "unread"
                ? "No unread notifications"
                : "No notifications yet"}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const tone = toneFor(notification);
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      `rounded-lg border p-4 transition-colors`,
                      notification.is_read ? "bg-card border-border" : tone.card,
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        {tone.icon}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3
                              className={cn(
                                "text-sm",
                                !notification.is_read &&
                                  "font-semibold",
                              )}
                            >
                              {notification.message}
                            </h3>
                            {!notification.is_read && (
                              <span className="h-2 w-2 rounded-full bg-info" />
                            )}
                          </div>
                          {notification.created_at && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDate(new Date(notification.created_at))}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center space-x-2">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={pendingIds[notification.id]}
                            onClick={() =>
                              handleMarkAsRead(notification.id)
                            }
                            title="Mark as read"
                          >
                            {pendingIds[notification.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletePending[notification.id]}
                          onClick={() => handleDelete(notification.id)}
                          title="Delete notification"
                        >
                          {deletePending[notification.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}