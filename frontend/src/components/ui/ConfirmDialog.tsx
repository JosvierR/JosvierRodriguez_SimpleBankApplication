import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Delete', busy, onConfirm, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (open) cancelRef.current?.focus() }, [open])
  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onCancel() }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [open, onCancel])
  if (!open) return null
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description">
        <h2 id="dialog-title">{title}</h2>
        <p id="dialog-description" className="text-secondary">{description}</p>
        <div className="dialog__actions">
          <button ref={cancelRef} className="button button--secondary" type="button" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="button button--danger" type="button" onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
