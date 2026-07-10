import { Building2, Inbox, LogOut, UserCircle } from 'lucide-react'
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

  return (
    <div className="flex min-h-screen">
      <aside className="bg-sidebar text-sidebar-foreground flex w-60 flex-col border-r">
        <div className="px-5 py-4 text-lg font-semibold">
          {t('nav.adminTitle')}
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          <NavLink to="/hotels" className={navLinkClass}>
            <Building2 className="size-4" />
            {t('nav.hotels')}
          </NavLink>
          <NavLink to="/requests" className={navLinkClass}>
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
          <span className="text-muted-foreground text-sm">
            {t('nav.platformConsole')}
          </span>
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
