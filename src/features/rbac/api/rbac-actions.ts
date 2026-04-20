"use server"

import { revalidatePath } from "next/cache"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { hashPassword } from "@/features/auth/utils/password"
import type { 
  Permission, 
  Role, 
  User, 
  SaveRolePayload, 
  SaveUserPayload 
} from "../types"

/**
 * Fetch all roles with their permissions.
 */
export async function getRoles(): Promise<Role[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await (supabase as any)
    .from("roles")
    .select("*, role_permissions(permission_id)")
  
  if (error) throw error
  return data
}

/**
 * Fetch all available permissions.
 */
export async function getPermissions(): Promise<Permission[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await (supabase as any)
    .from("permissions")
    .select("*")
  
  if (error) throw error
  return data
}

/**
 * Upsert a role and its permissions.
 */
export async function saveRole(role: SaveRolePayload) {
  const supabase = getSupabaseAdmin()

  // 1. Upsert role
  const rolePayload = { name: role.name, description: role.description }
  let roleId = role.id

  if (roleId) {
    const { error } = await (supabase as any)
      .from("roles")
      .update(rolePayload)
      .eq("id", roleId)
    if (error) throw error
  } else {
    const { data, error } = await (supabase as any)
      .from("roles")
      .insert(rolePayload)
      .select()
      .single()
    if (error) throw error
    roleId = data.id
  }

  // 2. Update permissions (Delete then Insert)
  await (supabase as any).from("role_permissions").delete().eq("role_id", roleId)
  
  if (role.permissionIds.length > 0) {
    const { error: linkError } = await (supabase as any)
      .from("role_permissions")
      .insert(role.permissionIds.map(pId => ({ role_id: roleId, permission_id: pId })))
    if (linkError) throw linkError
  }

  revalidatePath("/cms")
  return { success: true }
}

/**
 * Delete a role.
 */
export async function deleteRole(roleId: number) {
  const supabase = getSupabaseAdmin()
  
  const { error } = await (supabase as any).from("roles").delete().eq("id", roleId)
  
  if (error) throw error
  
  revalidatePath("/cms")
  return { success: true }
}

/**
 * Fetch all users with their roles.
 */
export async function getUsers(): Promise<User[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await (supabase as any)
    .from("users")
    .select("*, user_roles(role_id)")
  
  if (error) throw error
  return data
}

/**
 * Create or update a user.
 */
export async function saveUser(user: SaveUserPayload) {
  const supabase = getSupabaseAdmin()

  let userId = user.id
  const userPayload: any = { 
    username: user.username, 
    display_name: user.displayName 
  }

  // Handle password if provided
  if (user.password) {
    userPayload.password_hash = await hashPassword(user.password)
  }

  if (userId) {
    const { error } = await (supabase as any)
      .from("users")
      .update(userPayload)
      .eq("id", userId)
    if (error) throw error
  } else {
    // New user MUST have a password
    if (!user.password) {
      throw new Error("Mật khẩu là bắt buộc khi tạo nhân sự mới.")
    }
    
    const { data, error } = await (supabase as any)
      .from("users")
      .insert(userPayload)
      .select()
      .single()
    if (error) throw error
    userId = data.id
  }

  // Sync roles
  await (supabase as any).from("user_roles").delete().eq("user_id", userId)
  if (user.roleIds.length > 0) {
    const { error: linkError } = await (supabase as any)
      .from("user_roles")
      .insert(user.roleIds.map(rId => ({ user_id: userId, role_id: rId })))
    if (linkError) throw linkError
  }

  revalidatePath("/cms")
  return { success: true }
}

/**
 * Delete a user.
 */
export async function deleteUser(userId: string) {
  const supabase = getSupabaseAdmin()
  
  const { error } = await (supabase as any).from("users").delete().eq("id", userId)
  
  if (error) throw error
  
  revalidatePath("/cms")
  return { success: true }
}
