'use server';

import { revalidateTag } from 'next/cache';
import { getSupabaseUser } from '@/lib/auth';
import { auth } from '@clerk/nextjs/server';
import { Logger } from '@/lib/utils/logger';
import { createAdminClient } from '@/lib/supabase/server';
import { CACHE_TAGS } from '@/lib/cache-tags';

export async function getNotificationsAction() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const userProfile = await getSupabaseUser();
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    const supabase = await createAdminClient();

    // Fetch notifications for the user
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_user_id', userProfile.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    return { success: true, data: { notifications } };
  } catch (error) {
    Logger.error('GET_NOTIFICATIONS_ACTION', 'Failed to get notifications', { error }, { details: {} });
    return { success: false, error: (error as Error).message };
  }
}

export async function createInviteNotification(notificationData: {
    senderId: string;
    senderOrganizationId: string;
    recipientEmail: string;
    link?: string;
}) {
    const supabase = await createAdminClient();

    try {
        const { data: sender, error: senderError } = await supabase
            .from("profiles")
            .select("*")
            .eq("clerk_user_id", notificationData.senderId)
            .single();

        if (senderError) {
            Logger.error(
                "CREATE_INVITE_NOTIFICATION_ERROR",
                "Error fetching sender profile",
                senderError,
                {
                    entityId: notificationData.senderId,
                    entityType: "organization_invites",
                    orgId: notificationData.senderOrganizationId,
                }
            );
            console.log("Error fetching sender profile:", senderError);
            throw senderError;
        }

        const { data: recipient, error: recipientError } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", notificationData.recipientEmail)
            .single();

        if (recipientError) {
            console.log("Error fetching recipient profile:", senderError);
            Logger.error(
                "CREATE_INVITE_NOTIFICATION_ERROR",
                "Error fetching recipient profile",
                recipientError,
                {
                    entityId: notificationData.senderId,
                    entityType: "organization_invites",
                    orgId: notificationData.senderOrganizationId,
                    details: { recipientEmail: notificationData.recipientEmail },
                }
            );
            throw senderError;
        }

        console.log("Recipient profile:", recipient);


        


        const { data: notification, error: notificationError } = await supabase.from("notifications").insert([
            {
                organization_id: notificationData.senderOrganizationId,
                recipient_user_id: recipient?.id,
                related_entity_id: notificationData.senderOrganizationId,
                associated_clerk_id: recipient?.clerk_user_id,
                message: `You received an organization 
                invitation from 
                ${sender.name
                        ? sender.name
                        : sender.email
                    }`,
                link: notificationData.link || null
            },
        ]);

        if (notificationError) {
            Logger.error(
                "CREATE_INVITE_NOTIFICATION_ERROR",
                "Error inserting invite notification",
                notificationError
            )

            console.log("Error inserting invite notification:", notificationError);
            throw notificationError;
        }

        revalidateTag(CACHE_TAGS.NOTIFICATIONS(recipient.clerk_user_id));

        Logger.success(
            "CREATE_INVITE_NOTIFICATION",
            `Invite notification created successfully`,
            {
                entityId: notificationData.senderId,
                entityType: "organization_invites",
                orgId: notificationData.senderOrganizationId,
                details: { recipientUserId: recipient.id, "created_by_profile": notificationData.senderId, "related_organization_id": notificationData.senderOrganizationId },
            }
        );

        return null;
    } catch (error: any) {
        console.error("Error creating invite notification:", error);
        throw new Error(error);
    }
}