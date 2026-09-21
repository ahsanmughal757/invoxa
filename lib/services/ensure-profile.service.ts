"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseClient } from "@/lib/repositories/base.repository";
import { Logger } from "@/lib/utils/logger";

export type EnsureProfileResult =
  | { profile: any; kind: "ok" }
  | { profile: null; kind: "clerk-user-unavailable"; error?: string }
  | { profile: null; kind: "clerk-user-incomplete"; error?: string }
  | { profile: null; kind: "email-clash"; error?: Error }
  | { profile: null; kind: "supabase-error"; error?: Error }
  | { profile: null; kind: "unexpected"; error?: Error };

export interface EnsureProfileIdentity {
  clerkUserId: string;
  name?: string | null;
  email?: string | null;
}

function getPrimaryEmail(
  emailAddresses?: Array<{
    id: string;
    emailAddress: string;
    primary?: boolean;
  }>,
): string | undefined {
  if (!emailAddresses?.length) return undefined;
  const primary = emailAddresses.find((e) => e.primary);
  return (primary ?? emailAddresses[0])?.emailAddress;
}

/**
 * Ensures exactly one Supabase `profiles` row exists for the given (or
 * currently authenticated) Clerk identity.
 *
 * - Single source of truth for profile *existence*. The Clerk webhook is the
 *   fast path; this function is the reconciliation/upsert path that the rest
 *   of the app relies on when the webhook is unavailable or has failed.
 *
 * - Idempotent & atomic: relies on the database `UNIQUE(clerk_user_id)`
 *   constraint with an `ON CONFLICT` upsert, so repeated and concurrent calls
 *   always converge to exactly one profile row regardless of how many
 *   requests run simultaneously.
 *
 * - Syncs ONLY Clerk-owned fields (`clerk_user_id`, `name`, `email`). It never
 *   touches application-managed columns and it NEVER provisions
 *   organizations, memberships, subscriptions, invoices, expenses, payments,
 *   or any other business records.
 *
 * - Required (non-empty) fields are checked first: a profile is never created
 *   from an incomplete identity.
 *
 * @param identity Optional resolved identity. When omitted, the identity is
 *   resolved from the authenticated Clerk session via `currentUser()`.
 *   Passing it explicitly (e.g. from the Clerk webhook) avoids a redundant
 *   lookup while still sharing the exact same upsert logic — one source of
 *   truth.
 */
export async function ensureProfile(
  identity?: EnsureProfileIdentity,
): Promise<EnsureProfileResult> {
  try {
    let id = identity;

    if (!id) {
      const user = await currentUser();

      // Clerk says there should be an authenticated identity but Clerk itself
      // could not be reached → fail clearly, never mint an incomplete profile.
      if (!user) {
        return {
          profile: null,
          kind: "clerk-user-unavailable",
          error:
            "Clerk session is authenticated but the Clerk user could not be retrieved.",
        };
      }

      const email = getPrimaryEmail(user.emailAddresses);
      if (!email) {
        return {
          profile: null,
          kind: "clerk-user-incomplete",
          error: "Authenticated Clerk user has no primary email address.",
        };
      }

      id = {
        clerkUserId: user.id,
        name:
          [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          "Unknown",
        email,
      };
    }

    // Never create a profile from an incomplete identity.
    if (!id.email) {
      return {
        profile: null,
        kind: "clerk-user-incomplete",
        error: "Clerk identity resolution failed: no email address available.",
      };
    }

    const supabase = await getSupabaseClient();

    // Atomic, idempotent upsert. `UNIQUE(clerk_user_id)` + `ON CONFLICT`
    // guarantees that concurrent/repeated calls produce exactly one row.
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          clerk_user_id: id.clerkUserId,
          name: id.name ?? null,
          email: id.email!,
        },
        { onConflict: "clerk_user_id" },
      )
      .select()
      .single();

    if (error) {
      // Distinguish a row-level email clash (another profile owns the email)
      // from a genuine database failure.
      if (error.code === "23505") {
        Logger.warn(
          "ENSURE_PROFILE",
          `clerk_user_id=${id.clerkUserId} conflicts on email with an existing profile`,
        );
        return { profile: null, kind: "email-clash", error };
      }
      Logger.error("ENSURE_PROFILE", "Failed to ensure profile", error);
      return { profile: null, kind: "supabase-error", error };
    }

    return { profile: data, kind: "ok" };
  } catch (error: any) {
    Logger.error("ENSURE_PROFILE", "Unexpected failure ensuring profile", error);
    return { profile: null, kind: "unexpected", error };
  }
}
