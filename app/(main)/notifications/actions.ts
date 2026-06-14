'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function markNotificationAsRead(id: string) {
  try {
    const supabase = createServerActionClient({ cookies });
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to mark notification as read' };
  }
}

export async function markAllNotificationsAsRead(recipientUserId: string) {
  try {
    const supabase = createServerActionClient({ cookies });
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_user_id', recipientUserId);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to mark all notifications as read' };
  }
}

export async function deleteNotification(id: string) {
  try {
    const supabase = createServerActionClient({ cookies });
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete notification' };
  }
}