import * as Dialog from '@radix-ui/react-dialog'
import * as Tooltip from '@radix-ui/react-tooltip'
import { ArrowLeftRight, Building2, ClipboardList, CreditCard, LayoutDashboard, LogOut, Menu, ShieldCheck, UserRound, Users, WalletCards, X } from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import type { Role } from '../../types/api'

interface NavItem { to: string; label: string; icon: ComponentType<{ size?: number }>; end?: boolean }

const customerItems: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/my-accounts', label: 'My Accounts', icon: WalletCards },
  { to: '/my-transfer', label: 'Transfer', icon: ArrowLeftRight },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

const staffItems: Record<Exclude<Role, 'CUSTOMER'>, NavItem[]> = {
  TELLER: [
    { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/accounts', label: 'Accounts', icon: WalletCards },
  ],
  MANAGER: [
    { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/accounts', label: 'Accounts', icon: WalletCards },
    { to: '/transfer', label: 'Transfers', icon: ArrowLeftRight },
    { to: '/audits', label: 'Audit', icon: ClipboardList },
  ],
  AUDITOR: [
    { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/accounts', label: 'Accounts', icon: CreditCard },
    { to: '/audits', label: 'Audit', icon: ClipboardList },
  ],
  ADMIN: [
    { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/accounts', label: 'Accounts', icon: WalletCards },
    { to: '/transfer', label: 'Transfers', icon: ArrowLeftRight },
    { to: '/audits', label: 'Audit', icon: ClipboardList },
    { to: '/admin/access', label: 'Access Management', icon: ShieldCheck },
    { to: '/admin/security-audit', label: 'Security Audit', icon: ClipboardList },
  ],
}

const roleLabels: Record<Role, string> = { CUSTOMER: 'Customer', TELLER: 'Teller', MANAGER: 'Manager', AUDITOR: 'Auditor', ADMIN: 'Administrator' }

function Navigation({ items, close }: { items: NavItem[]; close?: () => void }) {
  return <nav aria-label="Primary navigation">{items.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={close}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>
}

function UserBlock({ username, role, logout }: { username: string | null; role: Role; logout: () => void }) {
  return <div className="sidebar__user"><div className="avatar" aria-hidden="true">{username?.slice(0, 1).toUpperCase()}</div><div><strong>{username}</strong><small>{roleLabels[role]}</small></div><Tooltip.Root><Tooltip.Trigger asChild><button className="icon-button" onClick={logout} aria-label="Log out"><LogOut size={18} /></button></Tooltip.Trigger><Tooltip.Portal><Tooltip.Content className="tooltip" side="top">Log out<Tooltip.Arrow className="tooltip-arrow" /></Tooltip.Content></Tooltip.Portal></Tooltip.Root></div>
}

const routeTitles: Record<string, string> = {
  '/': 'Overview', '/customers': 'Customers', '/accounts': 'Accounts', '/transfer': 'Transfers', '/audits': 'Audit log',
  '/my-accounts': 'My Accounts', '/my-transfer': 'Transfer', '/profile': 'Profile', '/admin': 'Administration',
  '/admin/access': 'Access Management', '/admin/security-audit': 'Security Audit',
}

export function AppShell() {
  const { username, primaryRole, logout } = useAuth()
  const location = useLocation()
  const [navigationOpen, setNavigationOpen] = useState(false)
  const role = primaryRole || 'CUSTOMER'
  const items = role === 'CUSTOMER' ? customerItems : staffItems[role]
  const title = routeTitles[location.pathname] || (location.pathname.includes('transactions') ? 'Transactions' : location.pathname.includes('deposit') ? 'Deposit' : location.pathname.includes('withdraw') ? 'Withdraw' : location.pathname.startsWith('/customers/') ? 'Customer' : location.pathname === '/accounts/new' ? 'Open Account' : location.pathname.includes('accounts/') ? 'Account' : 'Simple Bank')

  return <Tooltip.Provider delayDuration={300}><div className="app-shell">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <aside className="sidebar sidebar--desktop"><div className="sidebar__brand"><span className="brand-mark"><Building2 size={18} /></span><strong>Simple Bank</strong></div><Navigation items={items} /><UserBlock username={username} role={role} logout={logout} /></aside>
    <div className="app-shell__content">
      <header className="topbar">
        <Dialog.Root open={navigationOpen} onOpenChange={setNavigationOpen}><Dialog.Trigger asChild><button className="mobile-menu icon-button" type="button" aria-label="Open navigation"><Menu size={21} /></button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="sheet-overlay" /><Dialog.Content className="mobile-sheet"><Dialog.Title className="sr-only">Navigation</Dialog.Title><div className="sidebar__brand"><span className="brand-mark"><Building2 size={18} /></span><span><strong>Simple Bank</strong><small>{roleLabels[role]}</small></span><Dialog.Close asChild><button className="icon-button sidebar__close" aria-label="Close navigation"><X size={19} /></button></Dialog.Close></div><Navigation items={items} close={() => setNavigationOpen(false)} /><UserBlock username={username} role={role} logout={logout} /></Dialog.Content></Dialog.Portal></Dialog.Root>
        <h1>{title}</h1><div className="topbar__identity"><span>{username}</span><small>{roleLabels[role]}</small></div>
      </header>
      <main id="main-content" className="main-content" tabIndex={-1}><Outlet /></main>
    </div>
  </div></Tooltip.Provider>
}
