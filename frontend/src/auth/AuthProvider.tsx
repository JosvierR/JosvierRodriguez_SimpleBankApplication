import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../api/authApi'
import { AUTH_INVALID_EVENT, TOKEN_KEY } from '../api/client'
import type { LoginRequest, RegisterRequest, Role } from '../types/api'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY))
  const [username, setUsername] = useState<string | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [primaryRole, setPrimaryRole] = useState<Role | null>(null)
  const [bankUserLinked, setBankUserLinked] = useState(false)
  const [isLoading, setIsLoading] = useState(() => Boolean(sessionStorage.getItem(TOKEN_KEY)))

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUsername(null)
    setRoles([])
    setPrimaryRole(null)
    setBankUserLinked(false)
    setIsLoading(false)
  }, [])

  const verify = useCallback(async () => {
    if (!sessionStorage.getItem(TOKEN_KEY)) {
      clearSession()
      return
    }
    setIsLoading(true)
    try {
      const identity = await authApi.verify()
      setToken(sessionStorage.getItem(TOKEN_KEY))
      setUsername(identity.username)
      setRoles(identity.roles)
      setPrimaryRole(identity.primaryRole)
      setBankUserLinked(identity.bankUserLinked)
    } catch {
      clearSession()
    } finally {
      setIsLoading(false)
    }
  }, [clearSession])

  useEffect(() => {
    void verify()
  }, [verify])

  useEffect(() => {
    window.addEventListener(AUTH_INVALID_EVENT, clearSession)
    return () => window.removeEventListener(AUTH_INVALID_EVENT, clearSession)
  }, [clearSession])

  async function authenticate(action: () => ReturnType<typeof authApi.login>) {
    const response = await action()
    sessionStorage.setItem(TOKEN_KEY, response.token)
    setToken(response.token)
    const identity = await authApi.verify()
    setUsername(identity.username)
    setRoles(identity.roles)
    setPrimaryRole(identity.primaryRole)
    setBankUserLinked(identity.bankUserLinked)
  }

  const value = useMemo(() => ({
    token,
    username,
    roles,
    primaryRole,
    bankUserLinked,
    isAuthenticated: Boolean(token && username),
    isLoading,
    login: (credentials: LoginRequest) => authenticate(() => authApi.login(credentials)),
    register: (details: RegisterRequest) => authenticate(() => authApi.register(details)),
    logout: clearSession,
    verify,
  }), [token, username, roles, primaryRole, bankUserLinked, isLoading, clearSession, verify])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
