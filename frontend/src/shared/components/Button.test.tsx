import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from '@/shared/components/Button';

describe('Button', () => {
  it('exposes the primary, secondary, and destructive variants', () => {
    render(
      <>
        <Button>Save</Button>
        <Button variant="secondary">Cancel</Button>
        <Button variant="destructive">Delete</Button>
        <Button variant="ghost">Later</Button>
        <Button variant="icon" aria-label="More">
          +
        </Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('data-variant', 'primary');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('data-variant', 'secondary');
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('data-variant', 'destructive');
    expect(screen.getByRole('button', { name: 'Later' })).toHaveAttribute('data-variant', 'ghost');
    expect(screen.getByRole('button', { name: 'More' })).toHaveAttribute('data-variant', 'icon');
  });
});
