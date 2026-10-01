import { useTranslation } from 'react-i18next';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DashboardActivityPoint } from '@/features/dashboard/types/dashboard';
import { EmptyState } from '@/shared/components/States';
import { formatCurrency } from '@/shared/utils/currency';
import { formatShortDate } from '@/shared/utils/dates';

export function ActivityChart({ data, includeTransfers = false }: { data: DashboardActivityPoint[]; includeTransfers?: boolean }) {
  const { t } = useTranslation('dashboard');
  if (data.length === 0) {
    return <EmptyState title={t('empty.noPeriodActivity')} message={t('empty.noPeriodActivityBody')} />;
  }

  const summary = includeTransfers
    ? t('chart.summaryThree', {
        deposits: formatCurrency(total(data, 'deposits')),
        withdrawals: formatCurrency(total(data, 'withdrawals')),
        transfers: formatCurrency(total(data, 'transfers')),
      })
    : t('chart.summaryTwo', {
        deposits: formatCurrency(total(data, 'deposits')),
        withdrawals: formatCurrency(total(data, 'withdrawals')),
      });

  return (
    <div className="activity-chart">
      <p className="activity-chart__summary">{summary}</p>
      <div className="activity-chart__legend" aria-hidden="true">
        <span className="chart-key chart-key--deposit">{t('chart.deposits')}</span>
        <span className="chart-key chart-key--withdrawal">{t('chart.withdrawals')}</span>
        {includeTransfers ? <span className="chart-key chart-key--transfer">{t('chart.transfers')}</span> : null}
      </div>
      <div className="activity-chart__canvas" role="img" aria-label={`${t('chart.accessibleLabel')} ${summary}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--separator)" vertical={false} strokeDasharray="2 8" />
            <XAxis dataKey="periodStart" tickFormatter={(value: string) => formatShortDate(value)} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={compactMoney} width={52} tickLine={false} axisLine={false} />
            <Tooltip
              labelFormatter={(value) => formatShortDate(String(value))}
              formatter={(value, name) => [formatCurrency(Number(value)), t(`chart.${String(name)}`)]}
              contentStyle={{ borderColor: 'var(--separator-strong)', borderRadius: 10, boxShadow: 'var(--shadow-raised)' }}
            />
            <Line type="monotone" dataKey="deposits" stroke="var(--chart-deposit)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            <Line
              type="monotone"
              dataKey="withdrawals"
              stroke="var(--chart-withdrawal)"
              strokeWidth={2.5}
              strokeDasharray="7 5"
              dot={false}
              activeDot={{ r: 4 }}
            />
            {includeTransfers ? (
              <Line
                type="monotone"
                dataKey="transfers"
                stroke="var(--chart-transfer)"
                strokeWidth={2.5}
                strokeDasharray="2 5"
                dot={false}
                activeDot={{ r: 4 }}
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function total(data: DashboardActivityPoint[], key: 'deposits' | 'withdrawals' | 'transfers') {
  return data.reduce((sum, point) => sum + Number(point[key]), 0);
}

function compactMoney(value: number) {
  if (Math.abs(value) >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value)}`;
}
