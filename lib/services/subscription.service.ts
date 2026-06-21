import { Logger } from "../utils/logger";
import { createAdminClient } from "../supabase/server";
import { ClientSubscription } from "@/types/invoice";

/**
 * Subscription Service
 * Handles all subscription and trial-related operations
 *
 * Three-Tier System:
 * 1. 3-Minute Trial - Unlimited everything, expires in 3 minutes
 * 2. 14-Day Trial - Unlimited everything, expires in 14 days
 * 3. Lifetime Access - $287 one-time payment, unlimited forever
 */

export interface SubscriptionData {
  id: string;
  user_id: string;
  clerk_user_id: string;
  plan: "3min-trial" | "14day-trial" | "lifetime";
  status: "active" | "trial" | "cancelled" | "expired";
  start_date: string;
  end_date: string;
  trial_start_date?: string | null;
  trial_end_date?: string | null;
  is_trial: boolean;
  trial_type?: "3min" | "14day" | null;
  is_lifetime?: boolean;
  invoice_limit: number;
  client_limit: number;
  features: string[];
}

/**
 * Get user's current subscription from database
 */
export const getUserSubscription = async (
  clerkUserId: string,
): Promise<SubscriptionData | null> => {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase.rpc("fn_get_user_subscription", {
      p_clerk_user_id: clerkUserId,
    });

    if (error) {
      Logger.error(
        "GET_USER_SUBSCRIPTION",
        "Error fetching subscription",
        error,
        { details: { clerkUserId } },
      );
      return null;
    }

    if (!data || data.length === 0) {
      Logger.error(
        "GET_USER_SUBSCRIPTION",
        "No subscription data is available for given user",
        error,
      );

      return null;
    }

    const subscription = data[0];

    return {
      id: subscription.id,
      user_id: subscription.user_id,
      clerk_user_id: subscription.clerk_user_id,
      plan: subscription.plan,
      status: subscription.status,
      start_date: subscription.start_date,
      end_date: subscription.end_date,
      trial_start_date: subscription.trial_start_date,
      trial_end_date: subscription.trial_end_date,
      is_trial: subscription.is_trial,
      trial_type: subscription.trial_type,
      is_lifetime: subscription.is_lifetime,
      invoice_limit: subscription.invoice_limit,
      client_limit: subscription.client_limit,
      features: subscription.features || [],
    };
  } catch (error: any) {
    Logger.error("GET_USER_SUBSCRIPTION", "Unexpected error", error, {
      details: { clerkUserId },
    });
    return null;
  }
}

/**
 * Check if user has an active trial
 */
export const isTrialActive = async (clerkUserId: string): Promise<boolean> => {
  try {
    const supabase = await createAdminClient();
    const userId = await getUserIdFromClerkId(clerkUserId);

    if (!userId) {
      return false;
    }

    const { data, error } = await supabase.rpc("fn_is_trial_active", {
      p_user_id: userId,
    });

    if (error) {
      Logger.error("IS_TRIAL_ACTIVE", "Error checking trial status", error, {
        details: { clerkUserId },
      });
      return false;
    }

    if (!data) {
      Logger.error(
        "IS_TRIAL_ACTIVE",
        "No subscription data is available for given user",
        error,
      );
      return false;
    }

    return data;
  } catch (error: any) {
    Logger.error("IS_TRIAL_ACTIVE", "Unexpected error", error, {
      details: { clerkUserId },
    });
    return false;
  }
}

/**
 * Get number of days remaining in trial (for 14-day trial)
 */
export const getTrialDaysRemaining = async (
  clerkUserId: string,
): Promise<number> => {
  try {
    const supabase = await createAdminClient();
    const userId = await getUserIdFromClerkId(clerkUserId);

    if (!userId) {
      return 0;
    }

    const { data, error } = await supabase.rpc("fn_get_trial_days_remaining", {
      p_user_id: userId,
    });

    if (error) {
      Logger.error(
        "GET_TRIAL_DAYS_REMAINING",
        "Error getting trial days",
        error,
        { details: { clerkUserId } },
      );
      return 0;
    }

    if (!data) {
      Logger.error(
        "GET_TRIAL_DAYS_REMAINING",
        "No subscription data is available for given user",
        error,
      );
      return 0;
    }

    return data;
  } catch (error: any) {
    Logger.error("GET_TRIAL_DAYS_REMAINING", "Unexpected error", error, {
      details: { clerkUserId },
    });
    return 0;
  }
}

/**
 * Get trial time remaining in seconds (for 3-minute trial)
 */
export const getTrialTimeRemainingSeconds = async (
  clerkUserId: string,
): Promise<number> => {
  try {
    const supabase = await createAdminClient();
    const userId = await getUserIdFromClerkId(clerkUserId);

    if (!userId) {
      return 0;
    }

    const { data, error } = await supabase.rpc(
      "fn_get_trial_time_remaining_seconds",
      {
        p_user_id: userId,
      },
    );

    if (error) {
      Logger.error(
        "GET_TRIAL_TIME_REMAINING",
        "Error getting trial time",
        error,
        { details: { clerkUserId } },
      );
      return 0;
    }

    if (!data) {
      Logger.error(
        "GET_TRIAL_TIME_REMAINING",
        "No subscription data is available for given user",
        error,
      );
      return 0;
    }

    return data;
  } catch (error: any) {
    Logger.error("GET_TRIAL_TIME_REMAINING", "Unexpected error", error, {
      details: { clerkUserId },
    });
    return 0;
  }
}

/**
 * Get trial type for user ('3min' or '14day')
 */
export const getTrialType = async (
  clerkUserId: string,
): Promise<"3min" | "14day" | null> => {
  try {
    const supabase = await createAdminClient();
    const userId = await getUserIdFromClerkId(clerkUserId);

    if (!userId) {
      return null;
    }

    const { data, error } = await supabase.rpc("fn_get_trial_type", {
      p_user_id: userId,
    });

    if (error) {
      Logger.error("GET_TRIAL_TYPE", "Error getting trial type", error, {
        details: { clerkUserId },
      });
      return null;
    }

    if (!data) {
      Logger.error(
        "GET_TRIAL_TYPE",
        "No subscription data is available for given user",
        error,
      );
      return null;
    }

    return data;
  } catch (error: any) {
    Logger.error("GET_TRIAL_TYPE", "Unexpected error", error, {
      details: { clerkUserId },
    });
    return null;
  }
}

/**
 * Check if user has lifetime access
 */
export const isLifetimeAccess = async (clerkUserId: string): Promise<boolean> => {
  try {
    const supabase = await createAdminClient();
    const userId = await getUserIdFromClerkId(clerkUserId);

    if (!userId) {
      return false;
    }

    const { data, error } = await supabase.rpc("fn_is_lifetime_access", {
      p_user_id: userId,
    });

    if (error) {
      Logger.error(
        "IS_LIFETIME_ACCESS",
        "Error checking lifetime access",
        error,
        { details: { clerkUserId } },
      );
      return false;
    }

    if (!data) {
      Logger.error(
        "IS_LIFETIME_ACCESS",
        "No subscription data is available for given user",
        error,
      );
      return false;
    }

    return data;
  } catch (error: any) {
    Logger.error("IS_LIFETIME_ACCESS", "Unexpected error", error, {
      details: { clerkUserId },
    });
    return false;
  }
}

/**
 * Check if user's subscription/trial is expired
 */
export const isSubscriptionExpired = async (
  clerkUserId: string,
): Promise<boolean> => {
  try {
    const supabase = await createAdminClient();
    const userId = await getUserIdFromClerkId(clerkUserId);

    if (!userId) {
      return false;
    }

    const { data, error } = await supabase.rpc("fn_is_subscription_expired", {
      p_user_id: userId,
    });

    if (error) {
      Logger.error(
        "IS_SUBSCRIPTION_EXPIRED",
        "Error checking expiration",
        error,
        { details: { clerkUserId } },
      );
      return false;
    }

    if (!data) {
      Logger.error(
        "IS_SUBSCRIPTION_EXPIRED",
        "No subscription data is available for given user",
        error,
      );
      return false;
    }

    return data;
  } catch (error: any) {
    Logger.error("IS_SUBSCRIPTION_EXPIRED", "Unexpected error", error, {
      details: { clerkUserId },
    });
    return false;
  }
}

/**
 * Create a trial subscription for a user
 */
export async function createTrialSubscription(
  userId: string,
  clerkUserId: string,
  trialType: "3min" | "14day" = "3min",
): Promise<SubscriptionData | null> {
  try {
    const supabase = await createAdminClient();

    const now = new Date();
    const endDate =
      trialType === "3min"
        ? new Date(now.getTime() + 3 * 60 * 1000) // 3 minutes
        : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

    const planName = trialType === "3min" ? "3min-trial" : "14day-trial";

    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        clerk_user_id: clerkUserId,
        plan: planName,
        status: "trial",
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        trial_start_date: now.toISOString(),
        trial_end_date: endDate.toISOString(),
        is_trial: true,
        trial_type: trialType,
        is_lifetime: false,
      })
      .select()
      .single();

    if (error) {
      Logger.error("CREATE_TRIAL_SUBSCRIPTION", "Error creating trial", error, {
        details: {
          userId,
          clerkUserId,
          trialType,
        },
      });
      return null;
    }

    // Mark user as having used trial
    await supabase
      .from("profiles")
      .update({ has_used_trial: true })
      .eq("id", userId);

    return {
      id: data.id,
      user_id: data.user_id,
      clerk_user_id: data.clerk_user_id,
      plan: data.plan,
      status: data.status,
      start_date: data.start_date,
      end_date: data.end_date,
      trial_start_date: data.trial_start_date,
      trial_end_date: data.trial_end_date,
      is_trial: data.is_trial,
      trial_type: data.trial_type,
      is_lifetime: data.is_lifetime,
      invoice_limit: -1, // Unlimited
      client_limit: -1, // Unlimited
      features: getAllFeatures(),
    };
  } catch (error: any) {
    Logger.error("CREATE_TRIAL_SUBSCRIPTION", "Unexpected error", error, {
      details: { userId, clerkUserId, trialType },
    });
    return null;
  }
}

/**
 * Upgrade to lifetime subscription ($287)
 */
export async function upgradeToLifetime(
  clerkUserId: string,
  price: number = 287.0,
): Promise<SubscriptionData | null> {
  try {
    const supabase = await createAdminClient();

    const userId = await getUserIdFromClerkId(clerkUserId);

    if (!userId) {
      Logger.error("UPGRADE_TO_LIFETIME", "User not found", { clerkUserId });
      return null;
    }

    // Use database function to create lifetime subscription
    const { data, error } = await supabase.rpc(
      "fn_create_lifetime_subscription",
      {
        p_user_id: userId,
        p_clerk_user_id: clerkUserId,
        p_price: price,
      },
    );

    if (error) {
      Logger.error(
        "UPGRADE_TO_LIFETIME",
        "Error creating lifetime subscription",
        error,
        { details: { clerkUserId } },
      );
      return null;
    }

    if (!data) {
      Logger.error(
        "UPGRADE_TO_LIFETIME",
        "Failed to create lifetime subscription",
        { clerkUserId },
      );
      return null;
    }

    // Fetch the created subscription
    const subscription = await getUserSubscription(clerkUserId);

    if (!subscription) {
      Logger.error(
        "UPGRADE_TO_LIFETIME",
        "Could not fetch created subscription",
        { clerkUserId },
      );
      return null;
    }

    return subscription;
  } catch (error: any) {
    Logger.error("UPGRADE_TO_LIFETIME", "Unexpected error", error, {
      details: { clerkUserId },
    });
    return null;
  }
}

/**
 * Create 14-day trial for user (manual creation)
 */
export async function create14DayTrial(
  userId: string,
  clerkUserId: string,
): Promise<SubscriptionData | null> {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase.rpc("fn_create_14day_trial", {
      p_user_id: userId,
      p_clerk_user_id: clerkUserId,
    });

    if (error) {
      Logger.error("CREATE_14DAY_TRIAL", "Error creating 14-day trial", error, {
        details: { userId, clerkUserId },
      });
      return null;
    }

    if (!data) {
      Logger.error(
        "CREATE_14DAY_TRIAL",
        "User already has active subscription",
        { clerkUserId },
      );
      return null;
    }

    const subscription = await getUserSubscription(clerkUserId);
    return subscription;
  } catch (error: any) {
    Logger.error("CREATE_14DAY_TRIAL", "Unexpected error", error, {
      details: {
        userId,
        clerkUserId,
      },
    });
    return null;
  }
}

/**
 * Get all available features (unlimited for all plans)
 */
function getAllFeatures(): string[] {
  return [
    "basic_invoicing",
    "client_management",
    "payment_tracking",
    "expense_tracking",
    "custom_templates",
    "reports_analytics",
    "multi_currency",
    "automated_reminders",
    "recurring_invoices",
    "pdf_customization",
    "bulk_operations",
    "advanced_reporting",
    "team_collaboration",
    "api_access",
    "white_label",
    "priority_support",
    "backup_restore",
  ];
}

/**
 * Get plan limits and features (all unlimited for new plans)
 */
export function getPlanLimits(plan: string): {
  invoiceLimit: number;
  clientLimit: number;
  features: string[];
} {
  // All new plans have unlimited everything
  return {
    invoiceLimit: -1, // Unlimited
    clientLimit: -1, // Unlimited
    features: getAllFeatures(),
  };
}

/**
 * Helper function to get user ID from Clerk ID
 */
async function getUserIdFromClerkId(
  clerkUserId: string,
): Promise<string | null> {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.id;
  } catch (error: any) {
    Logger.error("GET_USER_ID_FROM_CLERK", "Error", error, {
      details: { clerkUserId },
    });
    return null;
  }
}

/**
 * Update expired subscriptions (can be called periodically)
 */
export async function updateExpiredSubscriptions(): Promise<boolean> {
  try {
    const supabase = await createAdminClient();

    const { error } = await supabase.rpc("fn_update_expired_subscriptions");

    if (error) {
      Logger.error(
        "UPDATE_EXPIRED_SUBSCRIPTIONS",
        "Error updating expired subscriptions",
        error,
      );
      return false;
    }

    return true;
  } catch (error: any) {
    Logger.error("UPDATE_EXPIRED_SUBSCRIPTIONS", "Unexpected error", error);
    return false;
  }
}

/**
 * Check if user has already used their trial
 */
export const hasUsedTrial = async (clerkUserId: string): Promise<boolean> => {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("has_used_trial")
      .eq("clerk_user_id", clerkUserId)
      .single();

    if (error) {
      Logger.error(
        "HAS_USED_TRIAL",
        "Error checking the subscription of user trial!",
        error,
      );
      return false;
    }

    if (!data) {
      Logger.error(
        "HAS_USED_TRIAL",
        "No subscription data is available for given user",
        error,
      );
      return false;
    }

    return data.has_used_trial || false;
  } catch (error: any) {
    Logger.error("HAS_USED_TRIAL", "Error checking trial usage", error, {
      details: { clerkUserId },
    });
    return false;
  }
}
