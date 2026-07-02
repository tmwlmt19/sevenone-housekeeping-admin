import { Outlet } from 'react-router-dom'

import { useAuth } from '@/auth/auth-context'

/**
 * Admin-only app. The auth context verifies an admin session (or redirects to
 * the shared login app); here we just wait for that check to resolve.
 */
export function RequireAuth() {
  const { status } = useAuth()
  if (status !== 'authed') {
    return (
      <div className="text-muted-foreground flex min-h-screen items-center justify-center text-sm">
        Loading…
      </div>
    )
  }
  return <Outlet />
}
