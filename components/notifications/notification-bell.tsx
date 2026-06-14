"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { useAuth, useUser } from "@clerk/nextjs";
import { Bell } from "lucide-react";
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

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    setNots(notifications);
  }, [notifications]);

  const handleClearNotification = async (notificationId: string) => {
    if (!userId) return;

    try {
      const userData = await getDBUser(userId, "clerk");

      if (!userData.id) return;

      // Implement the logic to mark a single notification as read
      // This function needs to be created in your notifications queries
      await markNotificationAsRead(notificationId, userData.id);

      setNots((prevNots) => [
        ...prevNots.filter((n) => n.id !== notificationId),
      ]);
    } catch (error) {
      console.error("Error clearing notification:", error);
      toast.error("Failed to clear notification. Something went wrong.");
    }
  };

  const handleClearAll = async () => {
    if (!userId) return;

    try {
      const userData = await getDBUser(userId, "clerk");

      if (!userData.id) return;

      await clearAllNotificationsForUser(userData.id);

      setNots((prevNots) => []);
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast.error("Failed to clear notifications. Something went wrong.");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notifications</h4>
            <p className="text-sm text-muted-foreground">
              You have {unreadCount} unread messages.
            </p>
          </div>
          <div
            className="grid gap-2"
            style={{ overflowY: "scroll", maxHeight: "300px" }}
          >
            {nots.length > 0 ? (
              nots.map((notification) => {
                if (!notification.link)
                  return (
                    <div
                      key={notification.id}
                      // className="grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
                      className={clsx(
                        `items-start pb-4 last:mb-0 last:pb-0 transition-transform duration-300 ease-in-out transform translate-x-0`,
                        notification.is_read && "translate-x-4",
                      )}
                    >
                      <div className={`grid gap-1`}>
                        <p className="flex gap-2 text-sm font-medium">
                          <span className="flex w-2 rounded-full bg-sky-500" />
                          {notification.message}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClearNotification(notification.id)}
                      >
                        Mark as Read
                      </Button>
                    </div>
                  );

                return (
                  <Link
                    key={notification.id}
                    href={notification?.link}
                    // className="grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0 hover:bg-accent rounded-md p-2"
                    className={clsx(
                      `items-start pb-4 last:mb-0 last:pb-0 transition-transform duration-300 ease-in-out transform translate-x-0`,
                      notification.is_read && "translate-x-4",
                    )}
                  >
                    <div className="grid gap-1 hover:bg-accent">
                      <p className="flex gap-2 text-sm font-medium">
                        <span className="flex w-2 rounded-full bg-sky-500" />
                        {notification.message}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleClearNotification(notification.id)}
                    >
                      Mark as Read
                    </Button>
                  </Link>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                No new notifications.
              </p>
            )}

            <Button variant="default" onClick={handleClearAll}>
              Clear All
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
