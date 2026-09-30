import * as Dialog from '@radix-ui/react-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  ArrowLeftRight,
  Building2,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import { useState, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { appPath } from '@/app/routes';
import { useAuth } from '@/shared/auth/useAuth';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import type { Role } from '@/shared/types/api';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  end?: boolean;
}

export function AppShell() {
  const { t } = useTranslation();
  const { username, primaryRole, logout } = useAuth();
  const location = useLocation();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const role = primaryRole || 'CUSTOMER';
  const items = role === 'CUSTOMER' ? customerItems(t) : staffItems(t)[role];
  const title = titleFor(location.pathname, t);

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="app-shell">
        <a href="#main-content" className="skip-link">
          {t('skip')}
        </a>
        <aside className="sidebar sidebar--desktop">
          <div className="sidebar__brand">
            <span className="brand-mark">
              <Building2 size={18} />
            </span>
            <strong>Simple Bank</strong>
          </div>
          <Navigation items={items} label={t('nav.primary')} />
          <UserBlock username={username} role={role} logout={logout} />
        </aside>
        <div className="app-shell__content">
          <header className="topbar">
            <Dialog.Root open={navigationOpen} onOpenChange={setNavigationOpen}>
              <Dialog.Trigger asChild>
                <button className="mobile-menu icon-button" type="button" aria-label={t('nav.open')}>
                  <Menu size={21} />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="sheet-overlay" />
                <Dialog.Content className="mobile-sheet">
                  <Dialog.Title className="sr-only">{t('nav.menu')}</Dialog.Title>
                  <div className="sidebar__brand">
                    <span className="brand-mark">
                      <Building2 size={18} />
                    </span>
                    <span>
                      <strong>Simple Bank</strong>
                      <small>{t(`roles.${role}`)}</small>
                    </span>
                    <Dialog.Close asChild>
                      <button className="icon-button sidebar__close" aria-label={t('nav.close')}>
                        <X size={19} />
                      </button>
                    </Dialog.Close>
                  </div>
                  <Navigation items={items} label={t('nav.primary')} close={() => setNavigationOpen(false)} />
                  <UserBlock username={username} role={role} logout={logout} />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <h1>{title}</h1>
            <div className="topbar__tools">
              <LanguageSwitcher />
              <div className="topbar__identity">
                <span>{username}</span>
                <small>{t(`roles.${role}`)}</small>
              </div>
            </div>
          </header>
          <main id="main-content" className="main-content" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>
    </Tooltip.Provider>
  );
}

function customerItems(t: (key: string) => string): NavItem[] {
  return [
    { to: appPath(), label: t('nav.overview'), icon: LayoutDashboard, end: true },
    { to: appPath('/my-accounts'), label: t('nav.myAccounts'), icon: WalletCards },
    { to: appPath('/my-transfer'), label: t('nav.transfer'), icon: ArrowLeftRight },
    { to: appPath('/profile'), label: t('nav.profile'), icon: UserRound },
  ];
}

function staffItems(t: (key: string) => string): Record<Exclude<Role, 'CUSTOMER'>, NavItem[]> {
  const overview = { to: appPath(), label: t('nav.overview'), icon: LayoutDashboard, end: true };
  const customers = { to: appPath('/customers'), label: t('nav.customers'), icon: Users };
  const accounts = { to: appPath('/accounts'), label: t('nav.accounts'), icon: WalletCards };
  const transfers = { to: appPath('/transfer'), label: t('nav.transfers'), icon: ArrowLeftRight };
  const audit = { to: appPath('/audits'), label: t('nav.audit'), icon: ClipboardList };
  return {
    TELLER: [overview, customers, accounts],
    MANAGER: [overview, customers, accounts, transfers, audit],
    AUDITOR: [overview, customers, { ...accounts, icon: CreditCard }, audit],
    ADMIN: [
      overview,
      customers,
      accounts,
      transfers,
      audit,
      { to: appPath('/admin/access'), label: t('nav.access'), icon: ShieldCheck },
      { to: appPath('/admin/security-audit'), label: t('nav.securityAudit'), icon: ClipboardList },
    ],
  };
}

function Navigation({ items, close, label }: { items: NavItem[]; close?: () => void; label: string }) {
  return (
    <nav aria-label={label}>
      {items.map(({ to, label: itemLabel, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} onClick={close}>
          <Icon size={18} />
          <span>{itemLabel}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function UserBlock({ username, role, logout }: { username: string | null; role: Role; logout: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="sidebar__user">
      <div className="avatar" aria-hidden="true">
        {username?.slice(0, 1).toUpperCase()}
      </div>
      <div>
        <strong>{username}</strong>
        <small>{t(`roles.${role}`)}</small>
      </div>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button className="icon-button" onClick={logout} aria-label={t('signOut')}>
            <LogOut size={18} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="tooltip" side="top">
            {t('signOut')}
            <Tooltip.Arrow className="tooltip-arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </div>
  );
}

function titleFor(pathname: string, t: (key: string) => string) {
  const titles: Record<string, string> = {
    [appPath()]: t('nav.overview'),
    [appPath('/customers')]: t('nav.customers'),
    [appPath('/accounts')]: t('nav.accounts'),
    [appPath('/transfer')]: t('nav.transfers'),
    [appPath('/audits')]: t('banking:auditLog'),
    [appPath('/my-accounts')]: t('nav.myAccounts'),
    [appPath('/my-transfer')]: t('nav.transfer'),
    [appPath('/profile')]: t('nav.profile'),
    [appPath('/admin')]: t('roles.ADMIN'),
    [appPath('/admin/access')]: t('nav.access'),
    [appPath('/admin/security-audit')]: t('nav.securityAudit'),
  };
  return titles[pathname] || t('nav.overview');
}
