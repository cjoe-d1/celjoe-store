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
  ADMIN_PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

const isAccountPath = (pathname: string) =>
  ACCOUNT_PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

const hasSupabaseAuthCookie = (request: NextRequest): boolean => {
  for (const cookie of request.cookies.getAll()) {
    const name = cookie.name;
    if (name.includes("auth-token") && name.startsWith("sb-")) return true;
  }
  return false;
};

// Content Security Policy — strict but compatible with Next.js, Supabase,
// Paystack, WhatsApp, and image CDNs.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.paystack.co",
  "frame-src 'self' https://checkout.paystack.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasAdminSession = Boolean(request.cookies.get("celjoe_session")?.value);
  const hasCustomerSession = hasSupabaseAuthCookie(request);

  // --- Auth redirects ---

  if (isAdminPath(pathname) && !ADMIN_PUBLIC_PATHS.has(pathname)) {
    if (!hasAdminSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = `?next=${encodeURIComponent(pathname + (search || ""))}`;
      return NextResponse.redirect(url);
    }
  }

  if (isAccountPath(pathname) && !ACCOUNT_PUBLIC_PATHS.has(pathname)) {
    if (!hasCustomerSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/account/login";
      url.search = `?next=${encodeURIComponent(pathname + (search || ""))}`;
      return NextResponse.redirect(url);
    }
  }

  // --- Security headers ---

  const response = NextResponse.next();

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  // Prevent MIME-sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  // Restrict referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Disable unnecessary browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  // Content Security Policy
  response.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  // Prevent embedding in iframes (belt-and-suspenders with CSP)
  response.headers.set("X-DNS-Prefetch-Control", "on");
  // Cross-Origin isolation hints
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  // HSTS is set in next.config.ts headers — middleware can't control the
  // Strict-Transport-Security header on the initial TLS handshake (the
  // browser requires it to come from the HTTPS response headers, which
  // Next.js serves via the `headers()` config function).

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/health).*)",
  ],
};
