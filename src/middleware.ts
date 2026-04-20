import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "@/features/auth/utils/jwt"

/**
 * Middleware to protect CMS routes and handle authentication tokens.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Only run on CMS routes
  if (pathname.startsWith("/cms")) {
    const token = request.cookies.get("auth_token")?.value

    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL("/login", request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Verify token
    const payload = await verifyToken(token)
    if (!payload) {
      const loginUrl = new URL("/login", request.url)
      // Clear invalid cookie
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete("auth_token")
      return response
    }

    // Auth successful, proceed
    return NextResponse.next()
  }

  // Allow all other routes
  return NextResponse.next()
}

export const config = {
  matcher: ["/cms/:path*", "/login"],
}
