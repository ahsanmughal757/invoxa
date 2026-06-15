"use server";
import {
  getUserByClerkId,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
} from "@/lib/repositories/users.repository.func";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { Logger } from "@/lib/utils/logger";
import { NextResponse } from "next/server";

function getPrimaryEmail(emailAddresses: any[]): string | undefined {
  if (!emailAddresses?.length) return undefined;
  const primary =
    emailAddresses.find((e: any) => e.primary) ?? emailAddresses[0];
  return primary?.email_address;
}

function buildName(first?: string, last?: string): string {
  return [first, last].filter(Boolean).join(" ") || "Unknown";
}

export async function POST(request: Request) {
  try {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error("Missing CLERK_WEBHOOK_SECRET");
    }

    const body = await request.text();
    const headerPayload = await headers();

    const svixHeaders = {
      "svix-id": headerPayload.get("svix-id")!,
      "svix-timestamp": headerPayload.get("svix-timestamp")!,
      "svix-signature": headerPayload.get("svix-signature")!,
    };

    const wh = new Webhook(secret);
    const evt = wh.verify(body, svixHeaders) as { type: string; data: any };
    const { type, data } = evt;

    const email = getPrimaryEmail(data.email_addresses);
    const name = buildName(data.first_name, data.last_name);

    switch (type) {
      case "user.created": {
        const existing = await getUserByClerkId(data.id); // Check if profile exists in DB
        if (existing) {
          Logger.info(
            "CLERK_WEBHOOK",
            `User=${data.id} already exists, ensuring subscription`,
          );

          return NextResponse.json(
            { message: "User Already Exists" },
            { status: 200 },
          );
        }

        // Check if email exists in supabase DB already
        //
        //
        // const dbProfileByEmail = email && (await getUserByEmail(email));

        if (email) {
          // CLERK USER SYNC WITH DB --- START ------------------------------
          const existingByEmail = await getUserByEmail(email);
          console.debug(existingByEmail);

          if (existingByEmail) {
            // CASE: OUT OF SYNC -- In case that clerk ids of existing same email dont match in db i.e; no sync
            if (
              existingByEmail.clerk_user_id &&
              existingByEmail.clerk_user_id !== data.id
            ) {
              Logger.warn(
                "CLERK_WEBHOOK",
                `Email ${email} was linked to old clerk user=${existingByEmail.clerk_user_id}, adopting new clerk user=${data.id}`,
              );
              const updated = await updateUser(existingByEmail.id, {
                clerk_user_id: data.id,
                name,
                email,
              });
              if (!updated) {
                return NextResponse.json(
                  { message: "Failed to sync the user" },
                  { status: 500 },
                );
              }
              Logger.success(
                "CLERK_WEBHOOK",
                `User=${data.id} linked to existing profile`,
                null,
              );
              return NextResponse.json(
                { message: "User synced with DB." },
                { status: 200 },
              );
            }
          }
        }

        // CLERK USER SYNC WITH DB --- END ------------------------------

        // CASE: IF USER DOES NOT EXISTS IN DATABASE __ START ------------------------------
        const userData = await createUser({
          name,
          email,
          clerk_user_id: data.id,
        });

        if (!userData) {
          Logger.error(
            "CLERK_WEBHOOK",
            "Error creating the user using clerk webhook for new user",
            null,
          );
          return NextResponse.json(
            { message: "Failed to create the new user " },
            { status: 500 },
          );
        }

        Logger.info(
          "CLERK_WEBHOOK",
          `User created: ${userData.id} (clerk=${data.id})`,
        );

        // Create trial subscription for new user
        const { createTrialSubscription } =
          await import("@/lib/services/subscription.service");
        const trialSub = await createTrialSubscription(
          userData.id,
          data.id,
          "14day",
        );
        if (!trialSub) {
          Logger.error(
            "CLERK_WEBHOOK",
            "Failed to create trial subscription",
            null,
          );
          return NextResponse.json(
            { message: "Failed to create trial subscription" },
            { status: 500 },
          );
        }
        Logger.info("CLERK_WEBHOOK", `Trial created for user=${data.id}`);

        return NextResponse.json(
          { message: `User created: ${data.id}` },
          { status: 200 },
        );
      }

      case "user.updated": {
        const existing = await getUserByClerkId(data.id);
        if (!existing) {
          Logger.warn(
            "CLERK_WEBHOOK",
            `user.updated for unknown user=${data.id}, skipping`,
          );
          return NextResponse.json(
            { message: "User not found" },
            { status: 200 },
          );
        }
        const updated = await updateUser(existing.id, { name, email });
        Logger.info("CLERK_WEBHOOK", `User=${data.id} profile synced`);
        return NextResponse.json({ message: "User updated" }, { status: 200 });
      }

      case "user.deleted": {
        const existing = await getUserByClerkId(data.id);
        if (!existing) {
          return NextResponse.json(
            { message: "User not found" },
            { status: 200 },
          );
        }
        const isDeleted = await deleteUser(existing.id);

        if (!isDeleted) {
          return NextResponse.json(
            { message: "Error deleting the user" },
            { status: 500 },
          );
        }

        Logger.info("CLERK_WEBHOOK", `User=${data.id} deleted from database`);
        return NextResponse.json({ message: "User deleted" }, { status: 200 });
      }

      default:
        return NextResponse.json(
          { message: "Unhandled event" },
          { status: 200 },
        );
    }
  } catch (err) {
    console.error("Webhook error:", err);
    Logger.error("CLERK_WEBHOOK", "Webhook processing failed", { error: err });
    return new Response("Invalid webhook", { status: 400 });
  }
}
