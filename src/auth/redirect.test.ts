/**
 * Unit tests for the admin app's redirectToLogin — the 401 bounce to the shared
 * login app with a return URL.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  env: { loginUrl: 'http://localhost:5174', apiBaseUrl: 'http://localhost:8000' },
}))

function stubLocation(href: string) {
  Object.defineProperty(window, 'location', {
    value: { href },
    writable: true,
    configurable: true,
  })
}

describe('redirectToLogin (admin)', () => {
  beforeEach(() => {
    vi.resetModules()
    stubLocation('http://localhost:5175/hotels')
  })

  it('sends the browser to the login app with an encoded return URL', async () => {
    const { redirectToLogin } = await import('./redirect')
    redirectToLogin()
    expect(window.location.href).toBe(
      `http://localhost:5174/?redirect=${encodeURIComponent('http://localhost:5175/hotels')}`,
    )
  })

  it('is idempotent — a second call does not navigate again', async () => {
    const { redirectToLogin } = await import('./redirect')
    redirectToLogin()
    window.location.href = 'http://localhost:5175/elsewhere'
    redirectToLogin()
    expect(window.location.href).toBe('http://localhost:5175/elsewhere')
  })
})
