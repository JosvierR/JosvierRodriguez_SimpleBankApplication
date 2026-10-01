import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PublicHeader } from '@/features/landing/components/PublicHeader';

function renderHeader(isAuthenticated: boolean) {
  return render(
    <MemoryRouter>
      <PublicHeader isAuthenticated={isAuthenticated} />
    </MemoryRouter>,
  );
}

describe('PublicHeader', () => {
  it('renders the brand, public navigation, and language selector', () => {
    renderHeader(false);
    expect(screen.getByLabelText('Simple Bank')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Personal banking' })).toHaveAttribute('href', '#personal');
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Español' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Français' })).toBeInTheDocument();
  });

  it('offers Sign in to visitors and Open app to authenticated users', () => {
    const { rerender } = renderHeader(false);
    expect(screen.getAllByRole('link', { name: 'Sign in' })[0]).toHaveAttribute('href', '/login');

    rerender(
      <MemoryRouter>
        <PublicHeader isAuthenticated />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('link', { name: 'Open app' })[0]).toHaveAttribute('href', '/app');
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
  });
});
