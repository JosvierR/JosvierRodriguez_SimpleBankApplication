import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ActivityChart } from '@/features/dashboard/components/ActivityChart';
import i18n from '@/shared/i18n/i18n';

describe('ActivityChart', () => {
  it('provides a textual summary and an accessible chart label for real values', () => {
    render(<ActivityChart includeTransfers data={[{ periodStart: '2026-09-30', deposits: 1000, withdrawals: 250, transfers: 400 }]} />);
    const summary = '$1,000.00 deposited, $250.00 withdrawn, and $400.00 transferred in this period.';
    expect(screen.getByText(summary)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: new RegExp(summary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })).toBeInTheDocument();
    expect(screen.getByText('Deposits')).toBeInTheDocument();
    expect(screen.getByText('Withdrawals')).toBeInTheDocument();
    expect(screen.getByText('Transfers')).toBeInTheDocument();
  });

  it('renders a localized empty state instead of empty axes', async () => {
    await i18n.changeLanguage('fr');
    render(<ActivityChart data={[]} />);
    expect(screen.getByRole('heading', { name: 'Aucune activité pendant cette période' })).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
