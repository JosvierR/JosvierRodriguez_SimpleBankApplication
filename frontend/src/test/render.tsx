import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render } from '@testing-library/react'
import { ToastProvider } from '../components/ui/Toast'

export function renderRoute(element: ReactNode, path = '/', pattern = '*') {
  return render(<MemoryRouter initialEntries={[path]}><ToastProvider><Routes><Route path={pattern} element={element} /></Routes></ToastProvider></MemoryRouter>)
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

export const account = {
  accountId: 'acc-101', userId: 'user-1', userName: 'Ada Lovelace', accountType: 'CHECKING' as const, balance: 550, createdAt: '2026-09-30T12:00:00Z',
}

export const customer = { id: 'user-1', name: 'Ada Lovelace', email: 'ada@example.com', createdAt: '2026-09-29T12:00:00Z' }
