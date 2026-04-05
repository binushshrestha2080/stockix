import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("stockix_token")?.value;
  const { pathname } = request.nextUrl;

  const protectedRoutes = ["/dashboard", "/admin"];
  const authRoutes      = ["/auth", "/auth/login", "/auth/register", "/auth/admin"];

  const isProtected = protectedRoutes.some(r => pathname.startsWith(r));
  const isAuthRoute = authRoutes.some(r => pathname.startsWith(r));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/auth/:path*"],
};