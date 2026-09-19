"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationCenter } from "@/components/notifications/notification-center";
import {
  markNotificationAsRead as markNotificationAsReadAction,
  markAllNotificationsAsRead as markAllAsReadAction,
  deleteNotification as deleteNotificationAction,
} from "./actions";

export default function NotificationsPage() {
  const { user } = useUser();
  const { notifications, setNotifications } = useNotifications(user?.id);
  const [items, setItems] = useState(notifications);

  useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  const markNotificationAsRead = async (id: string) => {
    const result = await markNotificationAsReadAction(id);
    if (!result.success) {
      throw new Error(result.error || "Failed to mark notification as read");
    }
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    const result = await markAllAsReadAction(user.id);
    if (!result.success) {
      throw new Error(result.error || "Failed to mark all as read");
    }
    setItems((prev) =>
      prev.map((n) => (n.is_read ? n : { ...n, is_read: true })),
    );
  };

  const onDeleteNotification = async (id: string) => {
    const result = await deleteNotificationAction(id);
    if (!result.success) {
      throw new Error(result.error || "Failed to delete notification");
    }
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationCenter
      notifications={items}
      onMarkAsRead={markNotificationAsRead}
      onMarkAllAsRead={markAllAsRead}
      onDeleteNotification={onDeleteNotification}
    />
  );
}