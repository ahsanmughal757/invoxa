// hooks/use-notifications.ts
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const useNotifications = (userId: string | undefined) => {
  const supabase = createClientComponentClient();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch of notifications
    const fetchInitialNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
      } else if (data) {
        setNotifications(data);
      }
    };

    fetchInitialNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel(`realtime:notifications:${userId}`)
      .on<Notification>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New notification received:', payload.new);
          // Add to state
          setNotifications((prev) => [payload.new as any, ...prev]);
          // Show a toast notification
          toast.success((payload.new as any).message || 'You have a new invoice.');
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  return { notifications };
};
