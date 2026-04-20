import "server-only"

import { cookies } from "next/headers"
import { verifyToken } from "../utils/jwt"
import type { UserSession } from "@/store/auth-store"

/**
 * Get the current user session from the auth cookie.
 * Server-side only.
 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  return {
    userId: payload.userId,
    username: payload.username,
    roles: payload.roles,
    permissions: payload.permissions,
  }
}
