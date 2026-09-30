import { Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import type { Role } from '../types/api'

export function RoleRoute({ allow }: { allow: Role[] }) {
  const { primaryRole } = useAuth()
  if (!primaryRole || !allow.includes(primaryRole)) return <section className="access-denied"><h1>Access denied</h1><p>You don&apos;t have access to this page.</p></section>
  return <Outlet />
}
