import { ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { meApi } from '@/features/customer-portal/api/meApi';
import { useAuth } from '@/shared/auth/useAuth';
import { PendingLinkState } from '@/features/customer-portal/components/PendingLinkState';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState, PageLoading } from '@/shared/components/States';
import type { CustomerAccountResponse, CustomerTransferReceiptResponse, TransferPreviewResponse } from '@/shared/types/api';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/dates';
import { amountError, getErrorMessage } from '@/shared/utils/errors';
import { maskAccountNumber } from '@/shared/utils/transfers';
import { useTranslation } from 'react-i18next';

type DestinationMode = 'mine' | 'other';

export function CustomerTransferPage() {
  const { t } = useTranslation(['banking', 'common']);
  const { bankUserLinked } = useAuth();
  const [params] = useSearchParams();
  const [accounts, setAccounts] = useState<CustomerAccountResponse[] | null>(null);
  const [from, setFrom] = useState(params.get('from') || '');
  const [mode, setMode] = useState<DestinationMode>('mine');
  const [ownedDestination, setOwnedDestination] = useState('');
  const [otherNumber, setOtherNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<TransferPreviewResponse | null>(null);
  const [receipt, setReceipt] = useState<CustomerTransferReceiptResponse | null>(null);

  useEffect(() => {
    if (bankUserLinked)
      meApi
        .accounts()
        .then((loaded) => {
          setAccounts(loaded);
          if (loaded.length === 1) setMode('other');
        })
        .catch((cause) => setError(getErrorMessage(cause)));
  }, [bankUserLinked]);

  const source = useMemo(() => accounts?.find((account) => account.accountId === from), [accounts, from]);
  const destinationNumber =
    mode === 'mine' ? accounts?.find((account) => account.accountId === ownedDestination)?.accountNumber || '' : otherNumber.trim();

  function resetFlow() {
    setPreview(null);
    setReceipt(null);
    setAmount('');
    setError('');
  }

  async function review(event: FormEvent) {
    event.preventDefault();
    setError('');
    const validation = amountError(amount);
    if (!from || !destinationNumber) return setError(t('selectBoth'));
    if (source?.accountNumber && source.accountNumber === destinationNumber) return setError(t('differentAccounts'));
    if (validation) return setError(validation);
    setBusy(true);
    try {
      setPreview(
        await meApi.previewTransfer({ sourceAccountId: from, destinationAccountNumber: destinationNumber, amount: Number(amount) }),
      );
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!preview) return;
    setBusy(true);
    setError('');
    try {
      const next = await meApi.transfer({
        sourceAccountId: from,
        destinationAccountNumber: destinationNumber,
        amount: Number(amount),
      });
      setReceipt(next);
      setPreview(null);
      setAccounts(
        (current) =>
          current?.map((account) => (account.accountId === from ? { ...account, balance: next.sourceBalance } : account)) ?? current,
      );
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  if (!bankUserLinked) return <PendingLinkState />;
  if (!accounts && !error) return <PageLoading />;
  return (
    <>
      <PageHeader title={t('common:nav.transfer')} />
      {accounts && accounts.length === 0 ? (
        <EmptyState title={t('noOwnedAccounts')} message={t('noCustomerAccounts')} />
      ) : (
        <section className="money-layout">
          <article className="grouped-section transfer-form">
            {receipt ? (
              <div className="success-state" role="status">
                <CheckCircle2 size={32} />
                <h2>{t('transferComplete')}</h2>
                <p>{t('transferReceipt')}</p>
                <dl className="transfer-result">
                  <div>
                    <dt>{t('amountLabel')}</dt>
                    <dd>{formatCurrency(Number(receipt.amount))}</dd>
                  </div>
                  <div>
                    <dt>{t('fromAccount')}</dt>
                    <dd>{receipt.sourceAccountNumberMasked}</dd>
                  </div>
                  <div>
                    <dt>{t('toAccount')}</dt>
                    <dd>{receipt.destinationAccountNumberMasked}</dd>
                  </div>
                  <div>
                    <dt>{t('recipient')}</dt>
                    <dd>{receipt.destinationDisplayName}</dd>
                  </div>
                  <div>
                    <dt>{t('reference')}</dt>
                    <dd>{receipt.transferReference}</dd>
                  </div>
                  <div>
                    <dt>{t('postedOn')}</dt>
                    <dd>{formatDateTime(receipt.createdAt)}</dd>
                  </div>
                </dl>
                <button className="button" type="button" onClick={resetFlow}>
                  {t('anotherTransfer')}
                </button>
              </div>
            ) : preview ? (
              <div className="transfer-preview">
                {error && (
                  <div className="form-error" role="alert">
                    {error}
                  </div>
                )}
                <h2>{t('previewTransfer')}</h2>
                <dl className="transfer-result">
                  <div>
                    <dt>{t('amountLabel')}</dt>
                    <dd>{formatCurrency(Number(preview.amount))}</dd>
                  </div>
                  <div>
                    <dt>{t('fromAccount')}</dt>
                    <dd>{preview.sourceAccountNumberMasked}</dd>
                  </div>
                  <div>
                    <dt>{t('toAccount')}</dt>
                    <dd>{preview.destinationAccountNumberMasked}</dd>
                  </div>
                  <div>
                    <dt>{t('recipient')}</dt>
                    <dd>{preview.destinationDisplayName}</dd>
                  </div>
                </dl>
                <div className="form-actions">
                  <button className="button button--secondary" type="button" onClick={() => setPreview(null)}>
                    {t('backToTransfer')}
                  </button>
                  <button className="button" type="button" onClick={() => void confirm()} disabled={busy}>
                    {busy ? t('transferring') : t('confirmTransfer')}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={(event) => void review(event)}>
                {error && (
                  <div className="form-error" role="alert">
                    {error}
                  </div>
                )}
                <label>
                  {t('fromAccount')}
                  <select value={from} onChange={(event) => setFrom(event.target.value)} required>
                    <option value="">{t('selectAccount')}</option>
                    {accounts?.map((account) => (
                      <option value={account.accountId} key={account.accountId}>
                        {accountLabel(account, t)}
                      </option>
                    ))}
                  </select>
                </label>
                <fieldset className="segmented segmented--choice" role="radiogroup" aria-label={t('destinationMode')}>
                  <legend>{t('destinationMode')}</legend>
                  <label>
                    <input type="radio" name="destination-mode" checked={mode === 'mine'} onChange={() => setMode('mine')} />
                    {t('myAccount')}
                  </label>
                  <label>
                    <input type="radio" name="destination-mode" checked={mode === 'other'} onChange={() => setMode('other')} />
                    {t('anotherBankAccount')}
                  </label>
                </fieldset>
                {mode === 'mine' ? (
                  <label>
                    {t('toAccount')}
                    <select value={ownedDestination} onChange={(event) => setOwnedDestination(event.target.value)} required>
                      <option value="">{t('selectAccount')}</option>
                      {accounts?.map((account) => (
                        <option value={account.accountId} key={account.accountId} disabled={account.accountId === from}>
                          {accountLabel(account, t)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label>
                    {t('destinationAccountNumber')}
                    <input
                      inputMode="numeric"
                      autoComplete="off"
                      value={otherNumber}
                      onChange={(event) => setOtherNumber(event.target.value.replace(/\D/g, '').slice(0, 12))}
                      required
                    />
                  </label>
                )}
                <label htmlFor="customer-transfer-amount">{t('amountLabel')}</label>
                <div className="currency-input">
                  <span>$</span>
                  <input
                    id="customer-transfer-amount"
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <button className="button" disabled={busy}>
                  <ArrowLeftRight size={17} />
                  {busy ? t('transferring') : t('previewTransfer')}
                </button>
              </form>
            )}
          </article>
          <aside className="transfer-summary">
            <span>{t('fromAccount')}</span>
            <strong>{source ? accountLabel(source, t) : t('selectAnAccount')}</strong>
            {source && <small>{t('availableAmount', { amount: formatCurrency(Number(source.balance)) })}</small>}
          </aside>
        </section>
      )}
    </>
  );
}

function accountLabel(account: CustomerAccountResponse, translate: (key: string) => string) {
  const kind = translate(`accountType.${account.accountType}`);
  const masked = maskAccountNumber(account.accountNumber || account.accountId);
  return `${kind} ${masked}`;
}
