// import { createClient } from "@supabase/supabase-js";
// import { useSession } from "@clerk/nextjs";

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// // const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
// const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
// if (!supabaseUrl || !supabasePublishableKey) {
//   throw new Error("Missing Supabase environment variables");
// }

// export const supabase = createClient(supabaseUrl, supabasePublishableKey);

// export function useSupabaseClient() {
//   const { session } = useSession();

//   const supabaseClient = createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
//     {

//       // Session accessed from Clerk SDK, either as Clerk.session (vanilla
//       // JavaScript) or useSession (React)
//       accessToken: async () => session?.getToken({template: 'supabase'}) ?? null,

//       // global: {
// 	    //     // Get the custom Supabase token from Clerk
// 	    //     fetch: async (url, options = {}) => {
// 		  //       // The Clerk `session` object has the getToken() method
// 	    //       const clerkToken = await session?.getToken({
// 		  //         // Pass the name of the JWT template you created in the Clerk Dashboard
// 		  //         // For this tutorial, you named it 'supabase'
// 	    //         template: 'supabase',
// 	    //       })
// 	    //       // Insert the Clerk Supabase token into the headers
// 		  //       const headers = new Headers(options?.headers)
// 	    //       headers.set('Authorization', `Bearer ${clerkToken}`)
// 	    //       // Call the default fetch
// 	    //       return fetch(url, {
// 	    //         ...options,
// 	    //         headers,
// 	    //       })
// 	    //     },
// 	      // },
//     }
//   );
//   return supabaseClient;
// }

import { createClient } from "@supabase/supabase-js";
import { useAuth, useSession } from "@clerk/nextjs";

export async function useSupabaseClient() {
  const { session } = useSession();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      accessToken: () => session?.getToken() ?? Promise.resolve(null),
    },
  );
}
