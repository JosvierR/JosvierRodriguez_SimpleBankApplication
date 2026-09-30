import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { accountsApi } from '../api/accountsApi'
import { account, renderRoute } from '../test/render'
import { TransactionHistoryPage } from './TransactionHistoryPage'

describe('TransactionHistoryPage', () => {
  it('renders transaction id, type, signed display amount, and date', async () => {
    vi.spyOn(accountsApi, 'get').mockResolvedValue(account); vi.spyOn(accountsApi, 'transactions').mockResolvedValue([
      { transactionId: 'tx-deposit', accountId: account.accountId, type: 'DEPOSIT', amount: 500, createdAt: account.createdAt },
      { transactionId: 'tx-withdraw', accountId: account.accountId, type: 'WITHDRAW', amount: 200, createdAt: account.createdAt },
    ])
    renderRoute(<TransactionHistoryPage />, '/accounts/acc-101/transactions', '/accounts/:accountId/transactions')
    expect(await screen.findByText('tx-deposit')).toBeInTheDocument(); expect(screen.getByText('Deposit')).toBeInTheDocument(); expect(screen.getByText('+$500.00')).toBeInTheDocument(); expect(screen.getByText('-$200.00')).toBeInTheDocument()
  })
})
