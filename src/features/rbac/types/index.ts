export interface Permission {
  id: number
  name: string
  key: string
  created_at?: string
}

export interface Role {
  id: number
  name: string
  description?: string
  created_at?: string
  role_permissions: {
    permission_id: number
  }[]
}

export interface User {
  id: string
  username: string
  display_name?: string
  created_at?: string
  user_roles: {
    role_id: number
  }[]
}

export interface SaveRolePayload {
  id?: number
  name: string
  description?: string
  permissionIds: number[]
}

export interface SaveUserPayload {
  id?: string
  username: string
  displayName?: string
  password?: string
  roleIds: number[]
}
