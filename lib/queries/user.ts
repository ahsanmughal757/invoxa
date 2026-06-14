"use server";
import { cache } from "react";
import { Logger } from "../utils/logger";
import { createAdminClient } from "../supabase/server";

export const getDBUser = cache(async (id: string, type: "db" | "clerk") => {
    try {
        const supabase = await createAdminClient();
        const { data: profileData, error: profileError } = await supabase.from("profiles")
            .select("*")
            .eq(type === "clerk" ? "clerk_user_id" : "id", id)
            .single();


        if (profileError) {
            if (profileError.code === 'PGRST116' || profileError.message.includes('Row not found')) {
                // User not found - return null as empty state
                Logger.info("GET_DB_USER", "User not found", { userId: id });
                return null;
            }

            Logger.error("GET_DB_USER", "Error fetching user", profileError, { userId: id });
            throw profileError;
        }

        return profileData;
    }
    catch (error: any) {
        Logger.error("GET_DB_USER", "Unexpected error", error, { userId: id });
        throw new Error(error)
    }
});

/**
 * Get user's subscription from database
 */
export const getUserSubscription = cache(async (clerkUserId: string) => {
    try {
        const supabase = await createAdminClient();
        
        const { data, error } = await supabase.rpc("fn_get_user_subscription", {
            p_clerk_user_id: clerkUserId
        });

        if (error) {
            Logger.error("GET_USER_SUBSCRIPTION", "Error fetching subscription", error, { details: { clerkUserId } });
            return null;
        }

        if (!data || data.length === 0) {
            return null;
        }

        return data[0];
    } catch (error: any) {
        Logger.error("GET_USER_SUBSCRIPTION", "Unexpected error", error, { details: { clerkUserId } });
        return null;
    }
});

/**
 * Check if user has already used their trial
 */
export const checkUserHasUsedTrial = cache(async (clerkUserId: string): Promise<boolean> => {
    try {
        const supabase = await createAdminClient();
        
        const { data, error } = await supabase
            .from("profiles")
            .select("has_used_trial")
            .eq("clerk_user_id", clerkUserId)
            .single();

        if (error || !data) {
            return false;
        }

        return data.has_used_trial || false;
    } catch (error: any) {
        Logger.error("CHECK_USER_HAS_USED_TRIAL", "Error", error, { details: { clerkUserId } });
        return false;
    }
});

