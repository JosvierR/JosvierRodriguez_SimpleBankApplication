import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import { AdminRoute } from './AdminRoute'
import { ProtectedRoute } from './ProtectedRoute'

const base: AuthContextValue = { token: null, username: null, roles: [], primaryRole: null, bankUserLinked: false, isAuthenticated: false, isLoading: false, login: async () => {}, register: async () => {}, logout: () => {}, verify: async () => {} }

describe('route guards', () => {
  it('redirects an unauthenticated protected route', () => {
    render(<AuthContext.Provider value={base}><MemoryRouter initialEntries={['/private']}><Routes><Route path="/login" element={<p>Login screen</p>} /><Route element={<ProtectedRoute />}><Route path="/private" element={<p>Private</p>} /></Route></Routes></MemoryRouter></AuthContext.Provider>)
    expect(screen.getByText('Login screen')).toBeInTheDocument()
  })

  it('denies a CUSTOMER who navigates to admin', () => {
    render(<AuthContext.Provider value={{ ...base, token: 'jwt', username: 'ada', roles: ['CUSTOMER'], primaryRole: 'CUSTOMER', isAuthenticated: true }}><MemoryRouter initialEntries={['/admin']}><Routes><Route element={<AdminRoute />}><Route path="/admin" element={<p>Admin content</p>} /></Route></Routes></MemoryRouter></AuthContext.Provider>)
    expect(screen.getByRole('heading', { name: 'Access denied' })).toBeInTheDocument(); expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
  })
})
