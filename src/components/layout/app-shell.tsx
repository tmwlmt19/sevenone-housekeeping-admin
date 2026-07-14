import { Building2, Inbox, LogOut, Menu, UserCircle } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '@/auth/auth-context'
import { PreferencesMenu } from '@/components/preferences-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAccessRequests } from '@/lib/queries/access-requests'
import { cn } from '@/lib/utils'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
      : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
  )

export function AppShell() {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const { data: pending } = useAccessRequests('pending')
  const pendingCount = pending?.length ?? 0
  // Sidebar is open by default on desktop, collapsed on small screens where it
  // becomes an off-canvas drawer toggled by the header hamburger.
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.matchMedia('(min-width: 768px)').matches,
  )

  // On mobile, tapping a link should also close the drawer.
  const closeOnMobile = () => {
    if (!window.matchMedia('(min-width: 768px)').matches) setSidebarOpen(false)
  }

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-hidden
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          'bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:transition-[width]',
          sidebarOpen
            ? 'translate-x-0 md:w-60'
            : '-translate-x-full md:w-0 md:overflow-hidden md:border-r-0',
        )}
      >
        <div className="px-5 py-4 text-lg font-semibold">
          {t('nav.adminTitle')}
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          <NavLink to="/hotels" className={navLinkClass} onClick={closeOnMobile}>
            <Building2 className="size-4" />
            {t('nav.hotels')}
          </NavLink>
          <NavLink
            to="/requests"
            className={navLinkClass}
            onClick={closeOnMobile}
          >
            <Inbox className="size-4" />
            {t('nav.requests')}
            {pendingCount > 0 && (
              <Badge className="ml-auto" variant="secondary">
                {pendingCount}
              </Badge>
            )}
          </NavLink>
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('nav.toggleMenu')}
              onClick={() => setSidebarOpen((open) => !open)}
            >
              <Menu className="size-5" />
            </Button>
            <span className="text-muted-foreground text-sm">
              {t('nav.platformConsole')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <PreferencesMenu />
            <Button asChild variant="ghost" size="sm">
              <Link to="/account">
                <UserCircle className="size-4" />
                {t('nav.account')}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut className="size-4" />
              {t('nav.logout')}
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
