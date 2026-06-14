"use client"

import { useUser } from '@clerk/nextjs';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationCenter } from '@/components/notifications/notification-center';
import {
  markNotificationAsRead as markNotificationAsReadAction,
  markAllNotificationsAsRead as markAllAsReadAction,
  deleteNotification as deleteNotificationAction
} from './actions';

export default function NotificationsPage() {
  const { user } = useUser();
  const { notifications } = useNotifications(user?.id);

  const markNotificationAsRead = async (id: string) => {
    await markNotificationAsReadAction(id);
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    await markAllAsReadAction(user.id);
  };

  const onDeleteNotification = async (id: string) => {
    await deleteNotificationAction(id);
  };

  return (
    <NotificationCenter
      notifications={notifications}
      onMarkAsRead={markNotificationAsRead}
      onMarkAllAsRead={markAllAsRead}
      onDeleteNotification={onDeleteNotification}
    />
  );
}
