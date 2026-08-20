import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '../context/auth-context'
import { ProtectedRoute } from './ProtectedRoute'

const useAuth = vi.fn()

vi.mock('../hooks/useAuth', () => ({ useAuth: () => useAuth() }))

function auth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    session: null,
    user: null,
    profile: null,
    loading: false,
    isAdmin: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  }
}

const SESSION = { user: { id: 'user-1' } } as AuthContextValue['session']

function renderAt(path: string, requireAdmin = false) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin={requireAdmin}>
              <p>Secret dashboard</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('waits rather than deciding while the session is still loading', () => {
    useAuth.mockReturnValue(auth({ loading: true }))
    renderAt('/admin', true)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument()
    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
  })

  it('sends a signed-out visitor to the login page', () => {
    useAuth.mockReturnValue(auth())
    renderAt('/admin', true)

    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('blocks a signed-in non-admin', () => {
    useAuth.mockReturnValue(auth({ session: SESSION, isAdmin: false }))
    renderAt('/admin', true)

    expect(screen.getByText('Admins only')).toBeInTheDocument()
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument()
  })

  it('lets an admin through', () => {
    useAuth.mockReturnValue(auth({ session: SESSION, isAdmin: true }))
    renderAt('/admin', true)

    expect(screen.getByText('Secret dashboard')).toBeInTheDocument()
  })

  it('only checks for a session when admin rights are not required', () => {
    useAuth.mockReturnValue(auth({ session: SESSION, isAdmin: false }))
    renderAt('/admin', false)

    expect(screen.getByText('Secret dashboard')).toBeInTheDocument()
  })
})
