# Invoice Sender & Intra-Organizational Notification System

## 1. Overview

This document outlines a sophisticated, real-time system to notify users within an organization when they receive an invoice from another user in the same organization. The system leverages a PostgreSQL trigger, Supabase Realtime subscriptions, and a dedicated notifications table to provide instant feedback to the user without requiring manual checks.

The core challenge is to identify when an invoice is sent to a "client" that is also a registered "user" of the platform within the same organization.

## 2. Proposed Solution

The system will be event-driven, centered around the creation of a new invoice.

**High-Level Data Flow:**

1.  **User A** (sender) creates an invoice addressed to **Client X**.
2.  The system checks if **Client X** is linked to a registered **User B** (recipient) in the same organization.
3.  If a link exists, a new record is created in a `notifications` table.
4.  A Supabase Realtime subscription, listening for changes on the `notifications` table, receives the new notification data on the client-side for **User B**.
5.  **User B**'s UI displays a real-time notification (e.g., a "toast") informing them of the new invoice.

## 3. Database Schema Design

To implement this, we need to ensure our schema can represent these relationships. We will add a `user_id` to the `clients` table and create a new `notifications` table.

### `clients` Table Modification

We'll add a nullable `user_id` to the `clients` table. This foreign key will link a client record to a user record. This is the key connection that allows us to identify when a client is also a user.

```sql
-- It is assumed the 'clients' table already exists.
-- We will add a new column to link a client to a user.
ALTER TABLE public.clients
ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
```

### `notifications` Table (New)

A new table to store notifications for users. This provides a persistent record of notifications and allows for features like an unread count or a notification inbox.

```sql
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user_id ON public.notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON public.notifications(organization_id);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
```

## 4. System Architecture & Implementation

### Step 1: Backend - PostgreSQL Trigger

When a new row is inserted into the `invoices` table, a trigger will execute a function. This function will perform the core logic of checking the recipient and creating a notification.

**Trigger Function (`create_invoice_notification`)**

```sql
CREATE OR REPLACE FUNCTION public.create_invoice_notification()
RETURNS TRIGGER AS $$
DECLARE
    client_user_id UUID;
    sender_user_id UUID;
    sender_name TEXT;
BEGIN
    -- Get the user_id associated with the client on the new invoice
    SELECT user_id INTO client_user_id
    FROM public.clients
    WHERE id = NEW.client_id;

    -- Get the sender's user_id from the new invoice
    sender_user_id := NEW.user_id;

    -- Proceed only if the client is a registered user and not the sender
    IF client_user_id IS NOT NULL AND client_user_id <> sender_user_id THEN
        -- Get the sender's name for a more descriptive notification message
        SELECT full_name INTO sender_name FROM public.users WHERE id = sender_user_id;

        IF sender_name IS NULL THEN
            sender_name := 'Another user';
        END IF;

        -- Insert a record into the notifications table
        INSERT INTO public.notifications (recipient_user_id, invoice_id, organization_id, message)
        VALUES (client_user_id, NEW.id, NEW.organization_id, sender_name || ' from your organization sent you an invoice.');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger Definition (`on_invoice_insert`)**

```sql
-- Drop existing trigger if it exists to ensure a clean setup
DROP TRIGGER IF EXISTS on_invoice_insert ON public.invoices;

-- Create the trigger to fire AFTER a new invoice is inserted
CREATE TRIGGER on_invoice_insert
AFTER INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.create_invoice_notification();
```

### Step 2: Real-time Layer - Supabase Subscriptions

The frontend will subscribe to `INSERT` events on the `notifications` table, filtered for the currently logged-in user.

### Step 3: Frontend - React Hook & UI

A custom React hook (`useNotifications`) will manage the Supabase subscription and handle incoming notification events.

**Example `useNotifications` Hook:**

```typescript
// hooks/use-notifications.ts
import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'react-hot-toast';

export const useNotifications = (userId: string | undefined) => {
  const supabase = useSupabaseClient();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch of notifications (optional)
    const fetchInitialNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_user_id', userId)
        .order('created_at', { ascending: false });
      if (data) setNotifications(data);
    };

    fetchInitialNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel(`realtime:notifications:${userId}`)
      .on(
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
          setNotifications((prev) => [payload.new, ...prev]);
          // Show a toast notification
          toast.success(payload.new.message || 'You have a new invoice.');
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
```

## 5. Security Considerations - Row-Level Security (RLS)

RLS policies are critical to ensure users can only access their own notifications.

**RLS Policy for `notifications` Table:**

```sql
-- Users can only see notifications sent to them within their organization
CREATE POLICY "Enable read access for user's own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = recipient_user_id);

-- Note: INSERT is handled by the trusted database trigger, so no INSERT policy is needed for users.
```

## 6. Next Steps

1.  **Apply Schema Changes:** Run the SQL commands to modify the `clients` table and create the `notifications` table.
2.  **Create Trigger Function:** Add the `create_invoice_notification` function and the `on_invoice_insert` trigger to your database.
3.  **Implement Frontend Hook:** Create the `useNotifications.ts` hook in your React application.
4.  **Integrate Notification UI:** Use a library like `react-hot-toast` to display notifications when they arrive and create a component (e.g., a dropdown from a bell icon) to display the list of persistent notifications.
5.  **Update Client Management:** Ensure that when an admin adds a "client" that is also a user, the `user_id` is correctly linked in the `clients` table.
