"use client"

import { useAuthStore } from "@/store/auth-store"

/**
 * Hook to check for permissions in the client-side.
 */
export function usePermissions() {
  const { user, hasPermission: hasPermissionBase } = useAuthStore()

  const hasPermission = (permission: string) => {
    return hasPermissionBase(permission)
  }

  return {
    user,
    hasPermission,
    isAdmin: user?.roles.includes("Admin") ?? false,

    // Department (ngành hàng) permissions
    canAddDepartment: hasPermission("department:create"),
    canDeleteDepartment: hasPermission("department:delete"),
    canEditTheme: hasPermission("department:theme"),
    canViewBackend: hasPermission("department:backend:read"),
    canEditBackend: hasPermission("department:backend"),

    // Staff (nhân sự) permissions
    canViewStaff: hasPermission("staff:read"),
    canAddStaff: hasPermission("staff:create"),
    canEditStaff: hasPermission("staff:update"),
    canDeleteStaff: hasPermission("staff:delete"),

    // Role assignment (phân quyền)
    canManageRoles: hasPermission("roles:manage"),
  }
}
