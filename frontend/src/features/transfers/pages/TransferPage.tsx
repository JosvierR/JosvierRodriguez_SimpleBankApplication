import { appPath } from '@/app/routes';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { accountsApi } from '@/features/accounts/api/accountsApi';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState, PageLoading } from '@/shared/components/States';
import { useToast } from '@/shared/components/Toast';
import type { AccountResponse, TransferResponse } from '@/shared/types/api';
import { formatCurrency } from '@/shared/utils/currency';
import { amountError, getErrorMessage } from '@/shared/utils/errors';
import { useTranslation } from 'react-i18next';

export function TransferPage() {
  const { t } = useTranslation(['banking', 'common']);
  const [params] = useSearchParams();
  const [accounts, setAccounts] = useState<AccountResponse[] | null>(null);
  const [from, setFrom] = useState(params.get('from') || '');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TransferResponse | null>(null);
  const { notify } = useToast();
  useEffect(() => {
    accountsApi
      .list()
      .then(setAccounts)
      .catch((cause) => setError(getErrorMessage(cause)));
  }, []);
  const source = useMemo(() => accounts?.find((item) => item.accountId === from), [accounts, from]);
  const destination = useMemo(() => accounts?.find((item) => item.accountId === to), [accounts, to]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    const validation = amountError(amount);
    if (!from || !to) {
      setError(t('selectSourceAndDestination'));
      return;
    }
    if (from === to) {
      setError(t('accountsMustDiffer'));
      return;
    }
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    try {
      const response = await accountsApi.transfer({ fromAccountId: from, toAccountId: to, amount: Number(amount) });
      setResult(response);
      notify(t('transferComplete') + '.');
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  if (!accounts && !error) return <PageLoading />;
  return (
    <>
      <PageHeader title={t('common:nav.transfers')} />
      <section className="money-layout">
        {accounts && accounts.length < 2 ? (
          <article className="panel">
            <EmptyState
              title={t('twoAccounts')}
              message={t('openTwoAccounts')}
              action={
                <Link className="button" to={appPath('/accounts/new')}>
                  {t('openAccount')}
                </Link>
              }
            />
          </article>
        ) : (
          <article className="panel transfer-form">
            {result ? (
              <div className="success-state" role="status">
                <CheckCircle2 size={34} />
                <h2>{t('transferComplete')}</h2>
                <p>{t('amountTransferred', { amount: formatCurrency(Number(result.amount)) })}</p>
                <dl className="transfer-result">
                  <div>
                    <dt>{t('sourceNewBalance')}</dt>
                    <dd>{formatCurrency(Number(result.fromBalance))}</dd>
                  </div>
                  <div>
                    <dt>{t('destinationNewBalance')}</dt>
                    <dd>{formatCurrency(Number(result.toBalance))}</dd>
                  </div>
                  <div>
                    <dt>{t('auditId')}</dt>
                    <dd className="mono">{result.auditId}</dd>
                  </div>
                </dl>
                <div>
                  <Link className="button" to={appPath(`/accounts/${result.fromAccountId}`)}>
                    View source account
                  </Link>
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => {
                      setResult(null);
                      setAmount('');
                    }}
                  >
                    New transfer
                  </button>
                </div>
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
                  <select value={from} onChange={(e) => setFrom(e.target.value)} required autoFocus>
                    <option value="">{t('selectSource')}</option>
                    {accounts?.map((account) => (
                      <option key={account.accountId} value={account.accountId}>
                        {account.userName} · {account.accountType} · {formatCurrency(Number(account.balance))}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t('toAccount')}
                  <select value={to} onChange={(e) => setTo(e.target.value)} required>
                    <option value="">{t('selectDestination')}</option>
                    {accounts?.map((account) => (
                      <option key={account.accountId} value={account.accountId} disabled={account.accountId === from}>
                        {account.userName} · {account.accountType} · {formatCurrency(Number(account.balance))}
                      </option>
                    ))}
                  </select>
                </label>
                <label htmlFor="transfer-amount">{t('amountLabel')}</label>
                <div className="currency-input">
                  <span>$</span>
                  <input
                    id="transfer-amount"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
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
        )}
        <aside className="panel form-aside">
          <p className="eyebrow">{t('transferSummary')}</p>
          <div className="transfer-visual">
            <div>
              <small>{t('fromShort')}</small>
              <strong>{source?.userName || t('selectSourceShort')}</strong>
              {source && <span>{formatCurrency(Number(source.balance))}</span>}
            </div>
            <ArrowLeftRight size={22} />
            <div>
              <small>{t('toShort')}</small>
              <strong>{destination?.userName || t('selectDestinationShort')}</strong>
              {destination && <span>{formatCurrency(Number(destination.balance))}</span>}
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
