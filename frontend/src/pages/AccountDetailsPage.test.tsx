import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { accountsApi } from '../api/accountsApi'
import { account, renderRoute } from '../test/render'
import { AccountDetailsPage } from './AccountDetailsPage'

describe('AccountDetailsPage', () => {
  it('renders backend details and updates only account type', async () => {
    vi.spyOn(accountsApi, 'get').mockResolvedValue(account); const update = vi.spyOn(accountsApi, 'update').mockResolvedValue({ ...account, accountType: 'SAVINGS' })
    renderRoute(<AccountDetailsPage />, '/accounts/acc-101', '/accounts/:accountId')
    expect(await screen.findByText('$550.00')).toBeInTheDocument(); expect(screen.getAllByText('Ada Lovelace')).toHaveLength(2)
    await userEvent.selectOptions(screen.getByLabelText('Account type'), 'SAVINGS')
    expect(update).toHaveBeenCalledWith('acc-101', { accountType: 'SAVINGS' }); expect(await screen.findAllByText('Savings')).toHaveLength(2); expect(screen.getByLabelText('Account type')).toHaveValue('SAVINGS')
  })
})
