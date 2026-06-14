"use server";
import { createClient } from "@supabase/supabase-js";
// import { auth } from "@clerk/nextjs/server";
// import { useSession } from "@clerk/nextjs";

export async function supabaseAdmin() {
//   const { getToken } = await auth();

  // const sessionHook = useSession()j
//   const token = await getToken({ template: "supabase" });

//   if (!token) {
//     throw new Error("Clerk token missing")
//   }

  // const token = await sessionHook.session?.getToken()

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,

  );
}
