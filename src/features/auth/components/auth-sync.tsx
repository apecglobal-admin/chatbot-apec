"use client"

import { useEffect } from "react"
import { useAuthStore, type UserSession, type AuthState } from "@/store/auth-store"

interface AuthSyncProps {
  session: UserSession | null
}

/**
 * Component to synchronize the server-side session with the client-side Zustand store.
 */
export function AuthSync({ session }: AuthSyncProps) {
  const setUser = useAuthStore((state: AuthState) => state.setUser)

  useEffect(() => {
    setUser(session)
  }, [session, setUser])

  return null
}
