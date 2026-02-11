import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProduction = process.env.NODE_ENV === "production";

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/privacy-policy",
  "/terms-of-service",


  //stripe routes here
  "/stripe/demo",
  "/stripe/success",
  "/stripe/cancel",

];

// Helper to add CORS headers for non-production environments
function addCorsHeaders(response: NextResponse, request: NextRequest) {
  if (!isProduction) {
    const origin = request.headers.get("origin") || "*";
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Max-Age", "86400");
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS preflight requests in non-production
  if (!isProduction && request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    return addCorsHeaders(response, request);
  }

  // Create response
  const response = NextResponse.next();

  // Add CORS headers for non-production
  addCorsHeaders(response, request);

  // Set CSP headers to allow iframe embedding
  // In non-production: allow all frame ancestors
  // In production: restrict to specific domains
  if (isProduction) {
    response.headers.set("Content-Security-Policy", "frame-ancestors 'self' https://web.totalum.app https://totalum-frontend-test.web.app http://localhost:8100");
  } else {
    response.headers.set("Content-Security-Policy", "frame-ancestors *");
  }
  response.headers.delete("X-Frame-Options"); // Remove X-Frame-Options if present

  // Allow all API routes and static files
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return response;
  }

  // Allow public routes
  if (publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
    return response;
  }

  // Check session cookie for protected routes (lightweight Edge-compatible check)
  // Better Auth uses "better-auth.session_token" or "__Secure-better-auth.session_token" (when secure)
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie) {
    // Redirect to login if no session cookie found
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);

    // Add CORS headers for non-production
    addCorsHeaders(redirectResponse, request);

    // Set CSP headers
    if (isProduction) {
      redirectResponse.headers.set("Content-Security-Policy", "frame-ancestors 'self' https://web.totalum.app https://totalum-frontend-test.web.app http://localhost:8100");
    } else {
      redirectResponse.headers.set("Content-Security-Policy", "frame-ancestors *");
    }
    return redirectResponse;
  }

  // Cookie exists - allow access
  // Note: Full session validation happens in Server Components/API routes
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};