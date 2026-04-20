"use client"

import React from "react"
import { usePermissions } from "../hooks/use-permissions"

interface PermissionGuardProps {
  permission?: string
  role?: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * A component that conditionally renders children based on the user's permissions or roles.
 */
export function PermissionGuard({
  permission,
  role,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, user } = usePermissions()

  if (!user) return <>{fallback}</>

  let hasAccess = false

  // Admin always has access
  if (user.roles.includes("Admin")) {
    hasAccess = true
  } else {
    const roleMatch = role ? user.roles.includes(role) : true
    const permissionMatch = permission ? hasPermission(permission) : true
    hasAccess = roleMatch && permissionMatch
  }

  if (hasAccess) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
