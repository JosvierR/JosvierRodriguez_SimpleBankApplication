import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PublicFooter } from '@/features/landing/components/PublicFooter';

describe('PublicFooter', () => {
  it('renders the educational disclosure and the links supplied by the parent', () => {
    render(<PublicFooter credentialsUrl="https://example.test/credentials" repositoryUrl="https://example.test/repository" />);
    expect(screen.getByText(/educational banking application/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Demo accounts' })).toHaveAttribute('href', 'https://example.test/credentials');
    expect(screen.getByRole('link', { name: 'Repository' })).toHaveAttribute('href', 'https://example.test/repository');
  });
});
