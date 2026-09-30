import { Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function AdminRoute() {
  const { roles } = useAuth()
  if (!roles.includes('ADMIN')) return <section className="access-denied"><p className="eyebrow">Restricted</p><h1>Access denied</h1><p>You need the ADMIN role to view this security demonstration.</p></section>
  return <Outlet />
}
