/**
 * Unit test for the admin console's RequireAuth gate. The admin app is a single
 * role (platform admin), so the only client-side guard is "wait for the session
 * check, then render". The browser-level behaviour is covered by AUTH-01 E2E.
 */
import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RequireAuth } from './guards'

const useAuth = vi.fn()
vi.mock('@/auth/auth-context', () => ({ useAuth: () => useAuth() }))

beforeEach(() => {
  useAuth.mockReset()
})

function renderGate() {
  return render(
    <MemoryRouter initialEntries={['/x']}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/x" element={<div>CONSOLE</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireAuth (admin)', () => {
  it('shows a placeholder while the session check is pending', () => {
    useAuth.mockReturnValue({ status: 'loading' })
    renderGate()
    expect(screen.queryByText('CONSOLE')).not.toBeInTheDocument()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders the console once authed', () => {
    useAuth.mockReturnValue({ status: 'authed' })
    renderGate()
    expect(screen.getByText('CONSOLE')).toBeInTheDocument()
  })
})
