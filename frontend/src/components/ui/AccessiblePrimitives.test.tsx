import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'
import { RowAction, RowActions } from './RowActions'

function DialogHarness() {
  const [open, setOpen] = useState(false)
  return <><button onClick={() => setOpen(true)}>Remove record</button><ConfirmDialog open={open} title="Delete record?" description="This cannot be undone." onCancel={() => setOpen(false)} onConfirm={vi.fn()} /></>
}

describe('Radix accessibility primitives', () => {
  it('traps AlertDialog focus, closes on Escape, and returns focus', async () => {
    render(<DialogHarness />)
    const user = userEvent.setup()
    const trigger = screen.getByRole('button', { name: 'Remove record' })
    await user.click(trigger)
    const dialog = screen.getByRole('alertdialog', { name: 'Delete record?' })
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
    await user.tab()
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('opens a row menu, closes on Escape, and returns focus', async () => {
    render(<MemoryRouter><RowActions label="Actions for Ada"><RowAction onSelect={vi.fn()}>View details</RowAction><RowAction destructive onSelect={vi.fn()}>Delete customer</RowAction></RowActions></MemoryRouter>)
    const user = userEvent.setup()
    const trigger = screen.getByRole('button', { name: 'Actions for Ada' })
    await user.click(trigger)
    const menu = screen.getByRole('menu')
    expect(menu).toContainElement(document.activeElement as HTMLElement)
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'View details' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
