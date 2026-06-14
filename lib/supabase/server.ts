// "use server";
// import process from "process";
// import { auth } from "@clerk/nextjs/server"
// import { createClient } from '@supabase/supabase-js'

// // For server-side operations with service role key
// export const createAdminClient = async () => {
//   // const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
//   // const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
//   // const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

//   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
//   const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
//   if (!supabaseUrl || !supabaseServiceRoleKey) {
//     throw new Error('Missing Supabase URL or Service Role Key')
//   }

//   return createClient(supabaseUrl, supabaseServiceRoleKey, {
//     accessToken: async () => {
//       return (await auth()).getToken() ?? null
//     }
//   })
// }

// TOKEN is not required for server-side operations with supabasesecret key, but can be included if needed for authentication context.
// SO RLS will work. 

import { createClient } from "@supabase/supabase-js";

export async function createAdminClient() {

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );
}
