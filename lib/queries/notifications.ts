"use server"

import { createAdminClient } from "../supabase/server";
import { Logger } from "@/lib/utils/logger";
import { currentUser } from "@clerk/nextjs/server";


export async function createInviteNotification(notificationData: {
    senderId: string;
    senderOrganizationId: string;
    recipientEmail: string;
    link?: string;
}) {
    const user = await currentUser();
    const supabase = await createAdminClient();

    try {
        const { data: sender, error: senderError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", notificationData.senderId)
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


interface InfoNotificationData { 
    senderId: string;
    senderOrganizationId?: string;
    recipientEmail: string;
    link?: string;
    message: string;
}

export async function createInfoNotification(notificationData: InfoNotificationData) {
    const user = await currentUser();
    const supabase = await createAdminClient();

    try {
        const { data: sender, error: senderError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", notificationData.senderId)
            .single();

        if (senderError) {
            Logger.error(
                "CREATE_INFO_NOTIFICATION_ERROR",
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

        console.log("notificationData.recipientEmail:", notificationData.recipientEmail);
        console.log("Recipient fetch result:", recipient, recipientError);
        if (recipientError) {
            console.log("Error fetching recipient profile:", senderError);
            Logger.error(
                "CREATE_INFO_NOTIFICATION_ERROR",
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
                // organization_id: notificationData.senderOrganizationId,
                recipient_user_id: recipient?.id,
                related_entity_id: sender?.id,
                associated_clerk_id: recipient?.clerk_user_id,
                // message: `${recipient?.name ? recipient?.name : recipient?.email} has accepted your invitation in your organization`,
                message: notificationData.message,
                link: notificationData.link || null
            },
        ]);

        if (notificationError) {
            Logger.error(
                "CREATE_INFO_NOTIFICATION",
                "Error inserting info notification",
                notificationError
            )

            console.log("Error inserting invite notification:", notificationError);
            throw notificationError;
        }

        Logger.success(
            "CREATE_INFO_NOTIFICATION",
            `Notification created successfully`,
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
        Logger.error(
            "CREATE_INFO_NOTIFICATION_ERROR",
            "Error creating info notification",
            error
        );
        throw new Error(error);
    }
}


export async function markNotificationAsRead(notificationId: string, recipient_user_id: string) { 
    try {
        const supabase = await createAdminClient();

        const { data, error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", notificationId)
            .eq("is_read", false)
            .eq("recipient_user_id", recipient_user_id)
            .single();


        if (error) {
            if (error.code === 'PGRST116' || error.message.includes('Row not found')) {
                // Notification not found - return null as empty state
                Logger.info(
                    "MARK_NOTIFICATION_AS_READ",
                    `Notification not found for user: ${recipient_user_id}`,
                    {
                        entityId: notificationId,
                        entityType: "notifications",
                    }
                );
                return null;
            }

            Logger.error(
                "CLEAR_NOTIFICATION_ERROR",
                `Error clearing notification for user: ${recipient_user_id}`,
                error,
                {
                    entityId: notificationId,
                    entityType: "notifications",
                }
            );
            console.error("Error clearing notification:", error);
            throw error;
        }

        Logger.success(
            "CLEAR_NOTIFICATIONS_SUCCESS",
            `Cleared notifications for user ${recipient_user_id}`,
            {
                entityId: notificationId,
                entityType: "notifications",
            }
        );

        return data;
    }
    catch (error) {
        Logger.error(
            "CLEAR_NOTIFICATION_ERROR",
            `Error clearing notifications for user: ${recipient_user_id}`,
            error
        );
        console.error("Error clearing notification:", error);
        throw new Error(error as any);
    }
}

export async function clearAllNotificationsForUser(recipient_user_id: string) {
    try {
        const supabase = await createAdminClient();

        const { data, error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("recipient_user_id", recipient_user_id)
            .eq("is_read", false);


        if (error) {
            Logger.error(
                "CLEAR_ALL_NOTIFICATIONS_ERROR",
                "Error clearing notifications for user",
                error,
                {
                    entityId: recipient_user_id,
                    entityType: "notifications",
                }
            );
            console.error("Error clearing notifications for user:", error);
            throw error;
        }

        Logger.success(
            "CLEAR_ALL_NOTIFICATIONS_SUCCESS",
            `Cleared all notifications for user ${recipient_user_id}`,
            {
                entityId: recipient_user_id,
                entityType: "notifications",
            }
        );

        return data;
    }
    catch (error) {
        Logger.error(
            "CLEAR_ALL_NOTIFICATIONS_ERROR",
            "Error clearing notifications for user",
            error
        );
        console.error("Error clearing notifications:", error);
        throw new Error(error as any);
    }

}