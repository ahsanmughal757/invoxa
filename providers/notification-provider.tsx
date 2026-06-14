"use client";
import React, { useState, createContext, useEffect } from "react";

import { useAuth } from "@clerk/nextjs";
import { useNotifications } from "@/hooks/use-notifications";

// hooks/use-notifications.ts
import { toast } from "react-hot-toast";
import { useSupabaseClient } from "@/lib/supabase/client";

type initialType = {
  notifications: any[];
};

const initial: initialType = {
  notifications: [],
};

const NotificationContext = createContext(initial);

export const NotificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const supabase = useSupabaseClient();

  useEffect(() => {
    // Initial fetch of notifications via server action instead of API route
    const fetchInitialNotifications = async () => {
      if (!userId) return;

      try {
        const result = await import('@/lib/actions/notification.actions')
          .then(actions => actions.getNotificationsAction());

        if (result.success && result.data) {
          setNotifications(result.data.notifications || []);
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchInitialNotifications();

    // Set up real-time subscription - this is the exception where direct Supabase access is needed for real-time updates
    // const channel = supabase
    //   .channel(`realtime:notifications:${userId}`)
    //   .on<Notification>(
    //     "postgres_changes",
    //     {
    //       event: "INSERT",
    //       schema: "public",
    //       table: "notifications",
    //       filter: `recipient_user_id=eq.${userId}`,
    //     },
    //     (payload) => {
    //       console.log("New notification received:", payload.new);
    //       // Add to state
    //       setNotifications((prev) => [payload.new as any, ...prev]);
    //       // Show a toast notification
    //       toast.success(
    //         (payload.new as any).message || "You have a new invoice."
    //       );
    //     }
    //   )
    //   .subscribe();

    // // Cleanup subscription on unmount
    // return () => {
    //   supabase.removeChannel(channel);
    // };
  }, [userId]);

  return (
    <NotificationContext.Provider
      value={{ notifications: notifications ? notifications : [] }}
    >
      {children}
    </NotificationContext.Provider>
  );
};


export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }

  return context;
}
