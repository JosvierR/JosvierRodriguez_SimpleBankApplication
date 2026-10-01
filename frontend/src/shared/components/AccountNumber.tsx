import { Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/shared/components/Toast';

export function AccountNumber({ value }: { value: string }) {
  const { t } = useTranslation('banking');
  const { notify } = useToast();

  async function copy() {
    await navigator.clipboard.writeText(value);
    notify(t('accountNumberCopied'), 'success');
  }

  return (
    <div className="account-number">
      <span className="account-number__label">{t('accountNumber')}</span>
      <span className="account-number__value">{value}</span>
      <button type="button" className="button button--secondary button--small" onClick={() => void copy()}>
        <Copy size={14} aria-hidden="true" />
        {t('copyAccountNumber')}
      </button>
    </div>
  );
}
