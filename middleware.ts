import { NextResponse, type NextRequest } from "next/server";

const ADMIN_PROTECTED_PREFIXES = ["/admin"];
const ADMIN_PUBLIC_PATHS = new Set<string>([
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
]);
const ACCOUNT_PROTECTED_PREFIXES = ["/account"];
const ACCOUNT_PUBLIC_PATHS = new Set<string>([
  "/account/login",
  "/account/register",
  "/account/forgot-password",
  "/account/reset-password",
]);

const isAdminPath = (pathname: string) =>
  ADMIN_PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

const isAccountPath = (pathname: string) =>
  ACCOUNT_PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

const hasSupabaseAuthCookie = (request: NextRequest): boolean => {
  for (const cookie of request.cookies.getAll()) {
    const name = cookie.name;
    // @supabase/ssr uses cookies named `sb-<project_ref>-auth-token`, often
    // chunked into `sb-<project_ref>-auth-token.0`, `.1`, etc. Accept any
    // cookie matching that pattern as evidence of a customer session.
    if (name.includes("auth-token") && name.startsWith("sb-")) return true;
  }
  return false;
};

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasAdminSession = Boolean(request.cookies.get("celjoe_session")?.value);
  const hasCustomerSession = hasSupabaseAuthCookie(request);

  if (isAdminPath(pathname) && !ADMIN_PUBLIC_PATHS.has(pathname)) {
    if (!hasAdminSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = `?next=${encodeURIComponent(pathname + (search || ""))}`;
      return NextResponse.redirect(url);
    }
  }

  if (
    isAccountPath(pathname) &&
    !ACCOUNT_PUBLIC_PATHS.has(pathname)
  ) {
    if (!hasCustomerSession) {
      // Redirect at the HTTP level so that an unauthenticated request to a
      // protected customer page goes to the sign-in screen immediately,
      // without depending on the in-band RSC payload redirect.
      const url = request.nextUrl.clone();
      url.pathname = "/account/login";
      url.search = `?next=${encodeURIComponent(pathname + (search || ""))}`;
      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/health).*)",
  ],
};
