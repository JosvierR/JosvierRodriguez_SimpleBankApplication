import { createContext } from 'react'
import type { LoginRequest, RegisterRequest, Role } from '../types/api'

export interface AuthContextValue {
  token: string | null
  username: string | null
  roles: Role[]
  primaryRole: Role | null
  bankUserLinked: boolean
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (details: RegisterRequest) => Promise<void>
  logout: () => void
  verify: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
