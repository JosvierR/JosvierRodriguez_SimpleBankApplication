import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { accountsApi } from '../api/accountsApi'
import { auditsApi } from '../api/auditsApi'
import { usersApi } from '../api/usersApi'
import { account, customer, renderRoute } from '../test/render'
import { DashboardPage } from './DashboardPage'

describe('DashboardPage', () => {
  it('calculates metrics from fetched backend values without invented trends', async () => {
    vi.spyOn(usersApi, 'list').mockResolvedValue([customer]); vi.spyOn(accountsApi, 'list').mockResolvedValue([account, { ...account, accountId: 'acc-2', balance: 100 }]); vi.spyOn(auditsApi, 'list').mockResolvedValue([{ id: 'audit-1', action: 'DEPOSIT', userId: customer.id, userName: customer.name, accountIds: [account.accountId], involvedUserIds: [customer.id], amount: 550, transactionIds: ['tx-1'], createdAt: account.createdAt, actorAuthUserId: 'auth-1', actorUsername: 'operator' }])
    renderRoute(<DashboardPage />)
    expect(await screen.findByText('$650.00')).toBeInTheDocument(); expect(screen.getByText('Ada Lovelace · operator')).toBeInTheDocument(); expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })
})
