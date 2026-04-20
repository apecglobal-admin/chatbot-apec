"use server"

import { cookies } from "next/headers"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { verifyPassword } from "../utils/password"
import { signToken } from "../utils/jwt"

/**
 * Log in a user with username and password.
 * Sets an HttpOnly cookie with the JWT.
 */
export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  if (!username || !password) {
    return { error: "Vui lòng nhập đầy đủ tài khoản và mật khẩu." }
  }

  const supabase = getSupabaseAdmin()

  // 1. Fetch user by username
  const { data: user, error: userError } = await (supabase as any)
    .from("users")
    .select("id, username, password_hash, display_name")
    .eq("username", username)
    .eq("is_active", true)
    .single()

  if (userError || !user) {
    return { error: "Tài khoản không tồn tại hoặc đã bị khóa." }
  }

  // 2. Verify password
  const isMatch = await verifyPassword(password, user.password_hash)
  if (!isMatch) {
    return { error: "Mật khẩu không chính xác." }
  }

  // 3. Fetch roles and permissions
  const { data: userRoles, error: rolesError } = await (supabase as any)
    .from("user_roles")
    .select("roles(name, role_permissions(permissions(key)))")
    .eq("user_id", user.id)

  const roles = userRoles?.map((r: any) => r.roles.name) || []
  const permissionSet = new Set<string>()
  userRoles?.forEach((r: any) => {
    r.roles.role_permissions.forEach((rp: any) => {
      permissionSet.add(rp.permissions.key)
    })
  })

  // 4. Sign JWT
  const token = await signToken({
    userId: user.id,
    username: user.username,
    roles,
    permissions: Array.from(permissionSet),
  })

  // 5. Set Cookie
  const cookieStore = await cookies()
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })

  return { success: true }
}

/**
 * Log out the current user.
 */
export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete("auth_token")
  return { success: true }
}
