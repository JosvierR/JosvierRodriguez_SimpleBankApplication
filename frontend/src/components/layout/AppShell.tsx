import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ArrowLeftRight, Building2, ClipboardList, LayoutDashboard, LogOut, Menu, ShieldCheck, Users, WalletCards, X } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'

const mainItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/accounts', label: 'Accounts', icon: WalletCards },
  { to: '/transfer', label: 'Transfer', icon: ArrowLeftRight },
  { to: '/audits', label: 'Audits', icon: ClipboardList },
]

const routeTitles: Record<string, string> = {
  '/': 'Overview', '/customers': 'Customers', '/accounts': 'Accounts', '/transfer': 'Transfer funds', '/audits': 'Audit trail', '/admin': 'Admin access',
}

export function AppShell() {
  const { username, roles, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const title = routeTitles[location.pathname] || (location.pathname.includes('transactions') ? 'Transaction history' : location.pathname.includes('deposit') ? 'Deposit' : location.pathname.includes('withdraw') ? 'Withdraw' : location.pathname.startsWith('/customers/') ? 'Customer details' : location.pathname === '/accounts/new' ? 'Open account' : location.pathname.startsWith('/accounts/') ? 'Account details' : 'Simple Bank')

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <button className="mobile-menu button button--secondary" type="button" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
      {open && <button className="sidebar-scrim" onClick={() => setOpen(false)} aria-label="Close navigation overlay" />}
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand"><span className="brand-mark"><Building2 size={19} /></span><span><strong>Simple Bank</strong><small>Operations</small></span><button className="icon-button sidebar__close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={19} /></button></div>
        <nav aria-label="Primary navigation">
          {mainItems.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}><Icon size={18} /><span>{label}</span></NavLink>)}
          {roles.includes('ADMIN') && <NavLink to="/admin" onClick={() => setOpen(false)}><ShieldCheck size={18} /><span>Admin</span></NavLink>}
        </nav>
        <div className="sidebar__user"><div className="avatar" aria-hidden="true">{username?.slice(0, 1).toUpperCase()}</div><div><strong>{username}</strong><small>{roles.join(' · ')}</small></div><button className="icon-button" onClick={logout} aria-label="Log out" title="Log out"><LogOut size={18} /></button></div>
      </aside>
      <div className="app-shell__content">
        <header className="topbar"><p>{title}</p><span className="status-pill"><i />Secure session</span></header>
        <main id="main-content" className="main-content" tabIndex={-1}><Outlet /></main>
      </div>
    </div>
  )
}
