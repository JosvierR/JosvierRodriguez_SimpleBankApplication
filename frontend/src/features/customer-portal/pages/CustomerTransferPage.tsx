import { ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { meApi } from '@/features/customer-portal/api/meApi';
import { useAuth } from '@/shared/auth/useAuth';
import { PendingLinkState } from '@/features/customer-portal/components/PendingLinkState';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState, PageLoading } from '@/shared/components/States';
import type { CustomerAccountResponse, CustomerTransferResponse } from '@/shared/types/api';
import { formatCurrency } from '@/shared/utils/currency';
import { amountError, getErrorMessage } from '@/shared/utils/errors';
import { useTranslation } from 'react-i18next';

export function CustomerTransferPage() {
  const { t } = useTranslation(['banking', 'common']);
  const { bankUserLinked } = useAuth();
  const [params] = useSearchParams();
  const [accounts, setAccounts] = useState<CustomerAccountResponse[] | null>(null);
  const [from, setFrom] = useState(params.get('from') || '');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CustomerTransferResponse | null>(null);
  useEffect(() => {
    if (bankUserLinked)
      meApi
        .accounts()
        .then(setAccounts)
        .catch((cause) => setError(getErrorMessage(cause)));
  }, [bankUserLinked]);
  const source = useMemo(() => accounts?.find((account) => account.accountId === from), [accounts, from]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    const validation = amountError(amount);
    if (!from || !to) return setError(t('selectBoth'));
    if (from === to) return setError(t('differentAccounts'));
    if (validation) return setError(validation);
    setBusy(true);
    try {
      setResult(await meApi.transfer({ fromAccountId: from, toAccountId: to, amount: Number(amount) }));
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
      {accounts && accounts.length < 2 ? (
        <EmptyState title={t('twoAccounts')} message={t('twoAccountsBody')} />
      ) : (
        <section className="money-layout">
          <article className="grouped-section transfer-form">
            {result ? (
              <div className="success-state" role="status">
                <CheckCircle2 size={32} />
                <h2>{t('transferComplete')}</h2>
                <p>{t('amountTransferred', { amount: formatCurrency(Number(result.amount)) })}</p>
                <dl className="transfer-result">
                  <div>
                    <dt>{t('sourceBalance')}</dt>
                    <dd>{formatCurrency(Number(result.fromBalance))}</dd>
                  </div>
                  <div>
                    <dt>{t('destinationBalance')}</dt>
                    <dd>{formatCurrency(Number(result.toBalance))}</dd>
                  </div>
                </dl>
                <button
                  className="button"
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setAmount('');
                  }}
                >
                  {t('anotherTransfer')}
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
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
                        {t(`accountType.${account.accountType}`)} •••• {account.accountId.slice(-4)} ·{' '}
                        {formatCurrency(Number(account.balance))}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t('toAccount')}
                  <select value={to} onChange={(event) => setTo(event.target.value)} required>
                    <option value="">{t('selectAccount')}</option>
                    {accounts?.map((account) => (
                      <option value={account.accountId} key={account.accountId} disabled={account.accountId === from}>
                        {t(`accountType.${account.accountType}`)} •••• {account.accountId.slice(-4)}
                      </option>
                    ))}
                  </select>
                </label>
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
                  {busy ? t('transferring') : t('transferFunds')}
                </button>
              </form>
            )}
          </article>
          <aside className="transfer-summary">
            <span>{t('fromAccount')}</span>
            <strong>
              {source ? `${t(`accountType.${source.accountType}`)} •••• ${source.accountId.slice(-4)}` : t('selectAnAccount')}
            </strong>
            {source && <small>{t('availableAmount', { amount: formatCurrency(Number(source.balance)) })}</small>}
          </aside>
        </section>
      )}
    </>
  );
}
