import { Building2, LogOut, UserCircle } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '@/auth/auth-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AppShell() {
  const { logout } = useAuth()

  return (
    <div className="flex min-h-screen">
      <aside className="bg-sidebar text-sidebar-foreground flex w-60 flex-col border-r">
        <div className="px-5 py-4 text-lg font-semibold">SevenOne Admin</div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          <NavLink
            to="/hotels"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
              )
            }
          >
            <Building2 className="size-4" />
            Hotels
          </NavLink>
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-6">
          <span className="text-muted-foreground text-sm">
            Platform console
          </span>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link to="/account">
                <UserCircle className="size-4" />
                Account
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut className="size-4" />
              Logout
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
