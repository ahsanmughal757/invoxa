"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { useAuth } from "@clerk/nextjs";
import { Bell, Loader2 } from "lucide-react";
import { useNotification } from "@/providers/notification-provider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

import { getDBUser } from "@/lib/queries/user";
import {
  clearAllNotificationsForUser,
  markNotificationAsRead,
} from "@/lib/queries/notifications";

export function NotificationBell() {
  const { userId } = useAuth();
  const { notifications } = useNotification();
  const [nots, setNots] = useState(notifications);
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});
  const [clearAllPending, setClearAllPending] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    setNots(notifications);
  }, [notifications]);

  const handleClearNotification = async (notificationId: string) => {
    if (!userId) return;

    setPendingIds((prev) => ({ ...prev, [notificationId]: true }));
    try {
      const userData = await getDBUser(userId, "clerk");

      if (!userData.id) return;

      await markNotificationAsRead(notificationId, userData.id);

      setNots((prevNots) => [
        ...prevNots.filter((n) => n.id !== notificationId),
      ]);
    } catch (error) {
      console.error("Error clearing notification:", error);
      toast.error("Failed to clear notification. Something went wrong.");
    } finally {
      setPendingIds((prev) => ({ ...prev, [notificationId]: false }));
    }
  };

  const handleClearAll = async () => {
    if (!userId) return;

    setClearAllPending(true);
    try {
      const userData = await getDBUser(userId, "clerk");

      if (!userData.id) return;

      await clearAllNotificationsForUser(userData.id);

      setNots([]);
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast.error("Failed to clear notifications. Something went wrong.");
    } finally {
      setClearAllPending(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 inline-flex h-4 min-w-4 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold leading-none text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notifications</h4>
            <p className="text-sm text-muted-foreground">
              You have {unreadCount} unread message
              {unreadCount === 1 ? "" : "s"}.
            </p>
          </div>
          <div
            className="grid gap-2"
            style={{ overflowY: "scroll", maxHeight: "300px" }}
          >
            {nots.length > 0 ? (
              nots.map((notification) => {
                const isPending = !!pendingIds[notification.id];
                const inner = (
                  <div className="flex items-start justify-between gap-2 rounded-md border border-border bg-card p-3">
                    <div className="grid gap-1">
                      <p className="text-sm font-medium leading-snug">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.created_at
                          ? new Date(notification.created_at).toLocaleString()
                          : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClearNotification(notification.id);
                      }}
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Mark as Read"
                      )}
                    </Button>
                  </div>
                );

                return notification.link ? (
                  <Link
                    key={notification.id}
                    href={notification.link}
                    className={clsx(
                      "rounded-md",
                      !notification.is_read && "ring-1 ring-blue-200",
                    )}
                    onClick={() =>
                      handleClearNotification(notification.id)
                    }
                  >
                    {inner}
                  </Link>
                ) : (
                  <div
                    key={notification.id}
                    className={clsx(
                      "rounded-md",
                      !notification.is_read && "ring-1 ring-blue-200",
                    )}
                  >
                    {inner}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                No new notifications.
              </p>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={handleClearAll}
              disabled={clearAllPending}
            >
              {clearAllPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Clear All
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}