import { NextResponse, type NextRequest } from "next/server";

const ADMIN_PROTECTED_PREFIXES = ["/admin"];
const ADMIN_PUBLIC_PATHS = new Set<string>([
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
]);
const ACCOUNT_PROTECTED_PREFIXES = ["/account"];

const isAdminPath = (pathname: string) =>
  ADMIN_PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

const isAccountPath = (pathname: string) =>
  ACCOUNT_PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get("celjoe_session")?.value);

  if (isAdminPath(pathname) && !ADMIN_PUBLIC_PATHS.has(pathname)) {
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = `?next=${encodeURIComponent(pathname + (search || ""))}`;
      return NextResponse.redirect(url);
    }
  }

  if (isAccountPath(pathname)) {
    if (!hasSession) {
      // For account pages, the public Supabase session is the source of truth.
      // We let the page server-component handle the redirect to /account/login
      // so unauthenticated users still see the customer shell.
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
