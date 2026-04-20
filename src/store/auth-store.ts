import { create } from "zustand"

export interface UserSession {
  userId: string
  username: string
  displayName?: string
  roles: string[]
  permissions: string[]
}

export interface AuthState {
  user: UserSession | null
  isLoading: boolean
  setUser: (user: UserSession | null) => void
  setLoading: (isLoading: boolean) => void
  logout: () => void
  hasPermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isLoading: false }),
  hasPermission: (permission) => {
    const user = get().user
    if (!user) return false
    // Adming role has all permissions
    if (user.roles.includes("Admin")) return true
    return user.permissions.includes(permission)
  },
}))
