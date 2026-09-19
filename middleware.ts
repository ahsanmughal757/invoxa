import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/site(.*)", "/(.*)"]);
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/site(.*)", "/api/webhooks/clerk", "/"]);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
  // if (pathname === '/site') {
  //   return NextResponse.rewrite(new URL("/", req.url));
  // }

  // Avoid rewrite loop: only rewrite /site if it wasn't already rewritten
  if (pathname === '/site' && !req.headers.get('x-rewritten')) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    const response = NextResponse.rewrite(url);
    response.headers.set('x-rewritten', '1');
    return response;
  }
  
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
