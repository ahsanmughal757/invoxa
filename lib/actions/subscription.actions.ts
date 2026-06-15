"use server";

import { revalidateTag } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Logger } from "../utils/logger";
import { CACHE_TAGS } from "../cache-tags";
import {
  getUserSubscription,
  createTrialSubscription,
  create14DayTrial,
  upgradeToLifetime,
  isTrialActive as isTrialActiveService,
  getTrialDaysRemaining as getTrialDaysRemainingService,
  getTrialTimeRemainingSeconds as getTrialTimeRemainingService,
  getTrialType as getTrialTypeService,
  isLifetimeAccess as isLifetimeAccessService,
  isSubscriptionExpired as isSubscriptionExpiredService,
  hasUsedTrial as hasUsedTrialService,
  SubscriptionData,
} from "../services/subscription.service";
import { getDBUser } from "../queries/user";
import { createUser } from "../repositories/users.repository.func";

/**
 * Get current user's subscription
 */
export async function getUserSubscriptionAction(): Promise<{
  subscription: SubscriptionData | null;
  error?: string;
} | null> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    const subscription = await getUserSubscription(userId);

    return {
      subscription,
    };
  } catch (error: any) {
    Logger.error("GET_USER_SUBSCRIPTION_ACTION", "Error", error);
    return {
      subscription: null,
      error: error.message || "Failed to fetch subscription",
    };
  }
}

/**
 * Check if user's trial is active
 */
export async function isTrialActiveAction(): Promise<{
  isActive: boolean;
  error?: string;
}> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { isActive: false };
    }

    const isActive = await isTrialActiveService(userId);

    return { isActive };
  } catch (error: any) {
    Logger.error("IS_TRIAL_ACTIVE_ACTION", "Error", error);
    return {
      isActive: false,
      error: error.message || "Failed to check trial status",
    };
  }
}

/**
 * Get days remaining in trial (for 14-day trial)
 */
export async function getTrialDaysRemainingAction(): Promise<{
  days: number;
  error?: string;
}> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { days: 0 };
    }

    const days = await getTrialDaysRemainingService(userId);

    return { days };
  } catch (error: any) {
    Logger.error("GET_TRIAL_DAYS_REMAINING_ACTION", "Error", error);
    return {
      days: 0,
      error: error.message || "Failed to get trial days",
    };
  }
}

/**
 * Get time remaining in seconds (for 3-minute trial)
 */
export async function getTrialTimeRemainingSecondsAction(): Promise<{
  seconds: number;
  error?: string;
}> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { seconds: 0 };
    }

    const seconds = await getTrialTimeRemainingService(userId);

    return { seconds };
  } catch (error: any) {
    Logger.error("GET_TRIAL_TIME_REMAINING_ACTION", "Error", error);
    return {
      seconds: 0,
      error: error.message || "Failed to get trial time",
    };
  }
}

/**
 * Get trial type for user ('3min' or '14day')
 */
export async function getTrialTypeAction(): Promise<{
  trialType: "3min" | "14day" | null;
  error?: string;
}> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { trialType: null };
    }

    const trialType = await getTrialTypeService(userId);

    return { trialType };
  } catch (error: any) {
    Logger.error("GET_TRIAL_TYPE_ACTION", "Error", error);
    return {
      trialType: null,
      error: error.message || "Failed to get trial type",
    };
  }
}

/**
 * Check if user has lifetime access
 */
export async function isLifetimeAccessAction(): Promise<{
  isLifetime: boolean;
  error?: string;
}> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { isLifetime: false };
    }

    const isLifetime = await isLifetimeAccessService(userId);

    return { isLifetime };
  } catch (error: any) {
    Logger.error("IS_LIFETIME_ACCESS_ACTION", "Error", error);
    return {
      isLifetime: false,
      error: error.message || "Failed to check lifetime access",
    };
  }
}

/**
 * Check if subscription is expired
 */
export async function isSubscriptionExpiredAction(): Promise<{
  isExpired: boolean;
  error?: string;
}> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { isExpired: false };
    }

    const isExpired = await isSubscriptionExpiredService(userId);

    return { isExpired };
  } catch (error: any) {
    Logger.error("IS_SUBSCRIPTION_EXPIRED_ACTION", "Error", error);
    return {
      isExpired: false,
      error: error.message || "Failed to check expiration",
    };
  }
}

/**
 * Get complete subscription status for frontend
 */
export async function getSubscriptionStatusAction(): Promise<{
  subscription: SubscriptionData | null;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  trialTimeRemainingSeconds: number;
  trialType: "3min" | "14day" | null;
  isLifetime: boolean;
  isExpired: boolean;
  hasUsedTrial: boolean;
  error?: string;
}> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        subscription: null,
        isTrialActive: false,
        trialDaysRemaining: 0,
        trialTimeRemainingSeconds: 0,
        trialType: null,
        isLifetime: false,
        isExpired: false,
        hasUsedTrial: false,
      };
    }

    // 1. Quick check: does a subscription exist?
    let subscription = await getUserSubscription(userId);

    // 2. Reconciliation: If no subscription or only a 3-min trigger trial,
    //    the webhook may have missed or partially failed. Create the DB
    //    profile and/or 14-day trial on-demand.
    if (!subscription || subscription.plan === "3min-trial") {
      try {
        const dbUser = await getDBUser(userId, "clerk");
        if (!dbUser) {
          Logger.info(
            "SYNC_USER",
            `No DB profile for clerk=${userId}, creating on-demand`,
          );
          const clerkUser = await currentUser();
          const primaryEmail =
            clerkUser?.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)
              ?.emailAddress ||
            clerkUser?.emailAddresses?.[0]?.emailAddress ||
            "";
          const name =
            [clerkUser?.firstName, clerkUser?.lastName]
              .filter(Boolean)
              .join(" ") || "Unknown";

          const created = await createUser({
            clerk_user_id: userId,
            name,
            email: primaryEmail,
          });
          if (created) {
            await createTrialSubscription(created.id, userId, "14day");
          }
        } else if (subscription?.plan === "3min-trial") {
          Logger.info(
            "SYNC_USER",
            `User=${userId} has only 3-min trial, upgrading to 14-day`,
          );
          await createTrialSubscription(dbUser.id, userId, "14day");
        }
      } catch (syncErr) {
        Logger.error("SYNC_USER", "Reconciliation failed", syncErr);
      }

      // Re-fetch subscription after reconciliation
      subscription = await getUserSubscription(userId);
    }

    // 3. Fetch all status data after potential reconciliation
    const [
      isTrialActive,
      trialDaysRemaining,
      trialTimeRemainingSeconds,
      trialType,
      isLifetime,
      isExpired,
      hasUsedTrial,
    ] = await Promise.all([
      isTrialActiveService(userId),
      getTrialDaysRemainingService(userId),
      getTrialTimeRemainingService(userId),
      getTrialTypeService(userId),
      isLifetimeAccessService(userId),
      isSubscriptionExpiredService(userId),
      hasUsedTrialService(userId),
    ]);

    return {
      subscription,
      isTrialActive,
      trialDaysRemaining,
      trialTimeRemainingSeconds,
      trialType,
      isLifetime,
      isExpired,
      hasUsedTrial,
    };
  } catch (error: any) {
    Logger.error("GET_SUBSCRIPTION_STATUS_ACTION", "Error", error);
    return {
      subscription: null,
      isTrialActive: false,
      trialDaysRemaining: 0,
      trialTimeRemainingSeconds: 0,
      trialType: null,
      isLifetime: false,
      isExpired: false,
      hasUsedTrial: false,
      error: error.message || "Failed to get subscription status",
    };
  }
}

/**
 * Upgrade to lifetime subscription ($287)
 */
export async function upgradeToLifetimeAction(): Promise<{
  success: boolean;
  subscription?: SubscriptionData | null;
  error?: string;
}> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    const subscription = await upgradeToLifetime(userId, 287.0);

    if (!subscription) {
      return {
        success: false,
        error: "Failed to upgrade to lifetime subscription",
      };
    }

    revalidateTag(CACHE_TAGS.SUBSCRIPTIONS(userId));

    return {
      success: true,
      subscription,
    };
  } catch (error: any) {
    Logger.error("UPGRADE_TO_LIFETIME_ACTION", "Error", error);
    return {
      success: false,
      error: error.message || "Failed to upgrade to lifetime subscription",
    };
  }
}

/**
 * Create trial subscription (manual creation for testing)
 */
export async function createTrialSubscriptionAction(
  trialType: "3min" | "14day" = "3min",
): Promise<{
  success: boolean;
  subscription?: SubscriptionData | null;
  error?: string;
}> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    // Check if user already has a subscription
    const existingSub = await getUserSubscription(userId);

    if (
      existingSub &&
      (existingSub.is_lifetime || existingSub.status === "trial")
    ) {
      return {
        success: false,
        error: "You already have an active subscription",
      };
    }

    // Get user profile
    const userProfile = await getDBUser(userId, "clerk");

    if (!userProfile) {
      return {
        success: false,
        error: "User profile not found",
      };
    }

    const subscription = await createTrialSubscription(
      userProfile.id,
      userId,
      trialType,
    );

    if (!subscription) {
      return {
        success: false,
        error: "Failed to create trial subscription",
      };
    }

    revalidateTag(CACHE_TAGS.SUBSCRIPTIONS(userId));

    return {
      success: true,
      subscription,
    };
  } catch (error: any) {
    Logger.error("CREATE_TRIAL_SUBSCRIPTION_ACTION", "Error", error, {
      details: { trialType },
    });
    return {
      success: false,
      error: error.message || "Failed to create trial subscription",
    };
  }
}

/**
 * Create 14-day trial for user
 */
export async function create14DayTrialAction(): Promise<{
  success: boolean;
  subscription?: SubscriptionData | null;
  error?: string;
}> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    // Check if user already has a subscription
    const existingSub = await getUserSubscription(userId);

    if (
      existingSub &&
      (existingSub.is_lifetime || existingSub.status === "trial")
    ) {
      return {
        success: false,
        error: "You already have an active subscription",
      };
    }

    // Get user profile
    const userProfile = await getDBUser(userId, "clerk");

    if (!userProfile) {
      return {
        success: false,
        error: "User profile not found",
      };
    }

    const subscription = await create14DayTrial(userProfile.id, userId);

    if (!subscription) {
      return {
        success: false,
        error: "Failed to create 14-day trial subscription",
      };
    }

    revalidateTag(CACHE_TAGS.SUBSCRIPTIONS(userId));

    return {
      success: true,
      subscription,
    };
  } catch (error: any) {
    Logger.error("CREATE_14DAY_TRIAL_ACTION", "Error", error);
    return {
      success: false,
      error: error.message || "Failed to create 14-day trial subscription",
    };
  }
}

/**
 * Check if user has already used their trial
 */
export async function hasUsedTrialAction(): Promise<{
  hasUsed: boolean;
  error?: string;
}> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { hasUsed: false };
    }

    const hasUsed = await hasUsedTrialService(userId);

    return { hasUsed: hasUsed };
  } catch (error: any) {
    Logger.error("HAS_USED_TRIAL_ACTION", "Error", error);
    return {
      hasUsed: false,
      error: error.message || "Failed to check trial usage",
    };
  }
}
