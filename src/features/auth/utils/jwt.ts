import "server-only"

import { SignJWT, jwtVerify } from "jose"

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.ENCRYPTION_KEY || "default_secret_key_change_me",
)

export type JWTPayload = {
  userId: string
  username: string
  roles: string[]
  permissions: string[]
}

/**
 * Sign a JWT with user information.
 */
export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)
}

/**
 * Verify and decode a JWT.
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as JWTPayload
  } catch (error) {
    console.error("JWT verification failed:", error)
    return null
  }
}
