import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel, busy, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useTranslation();
  const returnFocus = useRef<HTMLElement | null>(null);
  const label = confirmLabel || t('delete');

  useEffect(() => {
    if (open && document.activeElement instanceof HTMLElement) returnFocus.current = document.activeElement;
  }, [open]);

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-backdrop" />
        <AlertDialog.Content
          className="dialog"
          onCloseAutoFocus={(event) => {
            if (!returnFocus.current) return;
            event.preventDefault();
            returnFocus.current.focus();
          }}
        >
          <AlertDialog.Title>{title}</AlertDialog.Title>
          <AlertDialog.Description className="text-secondary">{description}</AlertDialog.Description>
          <div className="dialog__actions">
            <AlertDialog.Cancel asChild>
              <button className="button button--secondary" type="button" disabled={busy}>
                {t('cancel')}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button className="button button--danger" type="button" onClick={onConfirm} disabled={busy}>
                {busy ? t('working') : label}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
