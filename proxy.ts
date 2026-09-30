import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth/token";

/**
 * Optimistic gate: bounces signed-out visitors to /login before any page
 * renders. Pages and actions still call requireAdmin() themselves.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = verifyToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    return session ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }

  if (session) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return Response.json({ error: "Sign in again to continue." }, { status: 401 });
  }

  const login = new URL("/login", request.url);
  if (pathname !== "/") login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Public: the website's read API, uploaded images, and Next's own assets.
  matcher: [
    "/((?!api/public|uploads/|_next/static|_next/image|favicon.ico|login-blog.webp).*)",
  ],
};
