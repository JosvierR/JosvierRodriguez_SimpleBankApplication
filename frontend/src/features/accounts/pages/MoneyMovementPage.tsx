import { appPath } from '@/app/routes';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, CheckCircle2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { accountsApi } from '@/features/accounts/api/accountsApi';
import { PageHeader } from '@/shared/components/PageHeader';
import { ErrorState, PageLoading } from '@/shared/components/States';
import { useToast } from '@/shared/components/Toast';
import type { AccountResponse } from '@/shared/types/api';
import { formatCurrency } from '@/shared/utils/currency';
import { amountError, getErrorMessage } from '@/shared/utils/errors';
import { useTranslation } from 'react-i18next';

export function MoneyMovementPage({ kind }: { kind: 'deposit' | 'withdraw' }) {
  const { accountId = '' } = useParams();
  const { notify } = useToast();
  const { t } = useTranslation('banking');
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const isDeposit = kind === 'deposit';
  const load = useCallback(async () => {
    setError('');
    try {
      setAccount(await accountsApi.get(accountId));
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }, [accountId]);
  useEffect(() => {
    void load();
  }, [load]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const validation = amountError(amount);
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const updated = isDeposit
        ? await accountsApi.deposit(accountId, Number(amount))
        : await accountsApi.withdraw(accountId, Number(amount));
      setAccount(updated);
      setComplete(true);
      notify(isDeposit ? t('depositComplete') + '.' : t('withdrawalComplete') + '.');
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  if (!account && error) return <ErrorState title={t('accountUnavailable')} message={error} onRetry={() => void load()} />;
  if (!account) return <PageLoading />;
  const Icon = isDeposit ? ArrowDownToLine : ArrowUpFromLine;
  return (
    <>
      <Link className="back-link" to={appPath(`/accounts/${accountId}`)}>
        <ArrowLeft size={16} />
        {t('backToAccount')}
      </Link>
      <PageHeader
        title={isDeposit ? t('depositTitle') : t('withdrawTitle')}
        description={`${account.userName} · ${t(`accountType.${account.accountType}`)}`}
      />
      <section className="money-layout">
        <article className="panel money-form">
          <div className="current-balance">
            <span>{t('currentBalance')}</span>
            <strong>{formatCurrency(Number(account.balance))}</strong>
          </div>
          {complete ? (
            <div className="success-state" role="status">
              <CheckCircle2 size={34} />
              <h2>{isDeposit ? t('depositComplete') : t('withdrawalComplete')}</h2>
              <p>{t('newBalance')}</p>
              <strong>{formatCurrency(Number(account.balance))}</strong>
              <div>
                <Link className="button" to={appPath(`/accounts/${accountId}`)}>
                  {t('backToAccount')}
                </Link>
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => {
                    setAmount('');
                    setComplete(false);
                  }}
                >
                  {isDeposit ? t('anotherDeposit') : t('anotherWithdrawal')}
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
              <label htmlFor="movement-amount">{t('amountLabel')}</label>
              <div className="currency-input">
                <span>$</span>
                <input
                  id="movement-amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  autoFocus
                />
              </div>
              <p className="field-help">{t('amountHelp')}</p>
              <button className="button" disabled={busy}>
                <Icon size={17} />
                {busy ? t('processing') : isDeposit ? t('completeDeposit') : t('completeWithdrawal')}
              </button>
            </form>
          )}
        </article>
        <aside className="panel form-aside">
          <p className="eyebrow">{t('account')}</p>
          <h2 className="mono">{account.accountId}</h2>
          <dl className="mini-details">
            <div>
              <dt>{t('customer')}</dt>
              <dd>{account.userName}</dd>
            </div>
            <div>
              <dt>{t('type')}</dt>
              <dd>{t(`accountType.${account.accountType}`)}</dd>
            </div>
          </dl>
        </aside>
      </section>
    </>
  );
}

export function DepositPage() {
  return <MoneyMovementPage kind="deposit" />;
}
export function WithdrawPage() {
  return <MoneyMovementPage kind="withdraw" />;
}
