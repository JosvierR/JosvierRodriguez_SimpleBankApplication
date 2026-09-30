import { appPath } from '@/app/routes';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, UserPlus, Users } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { accountsApi } from '@/features/accounts/api/accountsApi';
import { usersApi } from '@/features/customers/api/usersApi';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/States';
import { useToast } from '@/shared/components/Toast';
import type { AccountType, UserResponse } from '@/shared/types/api';
import { getErrorMessage } from '@/shared/utils/errors';

export function CreateAccountPage() {
  const [params] = useSearchParams();
  const presetUserId = params.get('userId') || '';
  const [mode, setMode] = useState<'new' | 'existing'>(presetUserId ? 'existing' : 'new');
  const [users, setUsers] = useState<UserResponse[] | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState(presetUserId);
  const [accountType, setAccountType] = useState<AccountType>('CHECKING');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [partialUser, setPartialUser] = useState<UserResponse | null>(null);
  const navigate = useNavigate();
  const { notify } = useToast();
  useEffect(() => {
    usersApi
      .list()
      .then(setUsers)
      .catch((cause) => setError(getErrorMessage(cause)));
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    setPartialUser(null);
    try {
      let ownerId = userId;
      if (mode === 'new') {
        const customer = await usersApi.create({ name, email });
        ownerId = customer.id;
        try {
          const account = await accountsApi.create({ userId: ownerId, accountType });
          notify('Customer created and account opened.');
          navigate(appPath(`/accounts/${account.accountId}`));
          return;
        } catch (cause) {
          setPartialUser(customer);
          setUserId(customer.id);
          setError(`Customer was created, but the account could not be opened. ${getErrorMessage(cause)}`);
          return;
        }
      }
      if (!ownerId) {
        setError('Select an existing customer.');
        return;
      }
      const account = await accountsApi.create({ userId: ownerId, accountType });
      notify('Account opened.');
      navigate(appPath(`/accounts/${account.accountId}`));
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  if (!users && !error) return <PageLoading />;
  return (
    <>
      <Link className="back-link" to={appPath('/accounts')}>
        <ArrowLeft size={16} />
        Accounts
      </Link>
      <PageHeader title="Open account" />
      <section className="form-layout">
        <article className="panel form-panel">
          <div className="segmented" role="group" aria-label="Customer type">
            <button
              type="button"
              className={mode === 'new' ? 'active' : ''}
              onClick={() => {
                setMode('new');
                setPartialUser(null);
                setError('');
              }}
            >
              <UserPlus size={17} />
              New customer
            </button>
            <button
              type="button"
              className={mode === 'existing' ? 'active' : ''}
              onClick={() => {
                setMode('existing');
                setPartialUser(null);
                setError('');
              }}
            >
              <Users size={17} />
              Existing customer
            </button>
          </div>
          {error && (
            <div className={`form-error ${partialUser ? 'form-error--recovery' : ''}`} role="alert">
              <strong>{partialUser ? 'Account was not opened' : 'Unable to open account'}</strong>
              <span>{error}</span>
              {partialUser && (
                <span>
                  Customer ID: <code>{partialUser.id}</code>
                </span>
              )}
            </div>
          )}
          <form onSubmit={submit}>
            {mode === 'new' ? (
              <>
                <label>
                  Customer name
                  <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Full name" />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="customer@example.com"
                  />
                </label>
              </>
            ) : (
              <label>
                Customer
                <select value={userId} onChange={(e) => setUserId(e.target.value)} required autoFocus>
                  <option value="">Select a customer</option>
                  {users?.map((user) => (
                    <option value={user.id} key={user.id}>
                      {user.name} — {user.email}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <fieldset>
              <legend>Account type</legend>
              <div className="choice-grid">
                <label className={accountType === 'CHECKING' ? 'choice-card active' : 'choice-card'}>
                  <input
                    type="radio"
                    name="accountType"
                    value="CHECKING"
                    checked={accountType === 'CHECKING'}
                    onChange={() => setAccountType('CHECKING')}
                  />
                  <span>
                    <strong>Checking</strong>
                    <small>Checking account</small>
                  </span>
                  <CheckCircle2 size={18} />
                </label>
                <label className={accountType === 'SAVINGS' ? 'choice-card active' : 'choice-card'}>
                  <input
                    type="radio"
                    name="accountType"
                    value="SAVINGS"
                    checked={accountType === 'SAVINGS'}
                    onChange={() => setAccountType('SAVINGS')}
                  />
                  <span>
                    <strong>Savings</strong>
                    <small>Savings account</small>
                  </span>
                  <CheckCircle2 size={18} />
                </label>
              </div>
            </fieldset>
            <button className="button" disabled={busy}>
              {busy ? 'Opening account…' : partialUser ? 'Try opening account again' : 'Open account'}
            </button>
          </form>
          {partialUser && (
            <button
              className="button button--secondary recovery-action"
              type="button"
              onClick={() => {
                setMode('existing');
                setUserId(partialUser.id);
                setError('');
                setPartialUser(null);
              }}
            >
              Open account for this customer
            </button>
          )}
        </article>
      </section>
    </>
  );
}
