import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { accountsApi } from '../api/accountsApi'
import { ApiError } from '../api/client'
import { account, renderRoute } from '../test/render'
import { DepositPage, WithdrawPage } from './MoneyMovementPage'

describe('money movement pages', () => {
  it('completes a deposit and shows the new backend balance', async () => {
    vi.spyOn(accountsApi, 'get').mockResolvedValue(account); const deposit = vi.spyOn(accountsApi, 'deposit').mockResolvedValue({ ...account, balance: 1050 })
    renderRoute(<DepositPage />, '/accounts/acc-101/deposit', '/accounts/:accountId/deposit'); const user = userEvent.setup(); await user.type(await screen.findByLabelText('Amount'), '500'); await user.click(screen.getByRole('button', { name: 'Complete deposit' }))
    expect(deposit).toHaveBeenCalledWith('acc-101', 500); expect(await screen.findAllByText('$1,050.00')).toHaveLength(2)
  })

  it('completes a withdrawal', async () => {
    vi.spyOn(accountsApi, 'get').mockResolvedValue(account); const withdraw = vi.spyOn(accountsApi, 'withdraw').mockResolvedValue({ ...account, balance: 350 })
    renderRoute(<WithdrawPage />, '/accounts/acc-101/withdraw', '/accounts/:accountId/withdraw'); const user = userEvent.setup(); await user.type(await screen.findByLabelText('Amount'), '200'); await user.click(screen.getByRole('button', { name: 'Complete withdrawal' }))
    expect(withdraw).toHaveBeenCalledWith('acc-101', 200); expect(await screen.findAllByText('$350.00')).toHaveLength(2)
  })

  it('keeps the backend insufficient-funds error visible', async () => {
    vi.spyOn(accountsApi, 'get').mockResolvedValue(account); vi.spyOn(accountsApi, 'withdraw').mockRejectedValue(new ApiError('Insufficient funds', 400))
    renderRoute(<WithdrawPage />, '/accounts/acc-101/withdraw', '/accounts/:accountId/withdraw'); const user = userEvent.setup(); await user.type(await screen.findByLabelText('Amount'), '1000'); await user.click(screen.getByRole('button', { name: 'Complete withdrawal' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Insufficient funds')
  })
})
