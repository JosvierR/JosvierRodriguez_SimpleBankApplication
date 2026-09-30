import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import { usersApi } from '../api/usersApi'
import { customer, renderRoute } from '../test/render'
import { CustomersPage } from './CustomersPage'

describe('CustomersPage', () => {
  it('lists and updates a customer from backend data', async () => {
    vi.spyOn(usersApi, 'list').mockResolvedValue([customer]); const update = vi.spyOn(usersApi, 'update').mockResolvedValue({ ...customer, name: 'Ada Byron' })
    renderRoute(<CustomersPage />); const user = userEvent.setup(); expect(await screen.findByText('ada@example.com')).toBeInTheDocument(); await user.click(screen.getByRole('button', { name: 'Edit Ada Lovelace' })); const dialog = screen.getByRole('dialog'); const name = within(dialog).getByLabelText('Name'); await user.clear(name); await user.type(name, 'Ada Byron'); await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    expect(update).toHaveBeenCalledWith('user-1', { name: 'Ada Byron', email: 'ada@example.com' }); expect(await screen.findByText('Ada Byron')).toBeInTheDocument()
  })

  it('shows the professional conflict message when delete is rejected', async () => {
    vi.spyOn(usersApi, 'list').mockResolvedValue([customer]); vi.spyOn(usersApi, 'delete').mockRejectedValue(new ApiError('raw conflict', 409))
    renderRoute(<CustomersPage />); const user = userEvent.setup(); await user.click(await screen.findByRole('button', { name: 'Delete Ada Lovelace' })); await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect((await screen.findAllByText('This customer cannot be deleted while accounts still exist.')).length).toBeGreaterThan(0)
  })
})
