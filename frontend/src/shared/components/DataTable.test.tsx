import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DataTable, type DataColumn } from '@/shared/components/DataTable';

type Person = { id: string; name: string; city: string };

const columns: DataColumn<Person>[] = [
  { id: 'name', header: 'Name', sortValue: (row) => row.name, cell: (row) => row.name, mobile: 'primary' },
  { id: 'city', header: 'City', sortValue: (row) => row.city, cell: (row) => row.city, mobile: 'secondary' },
];

const people = [
  { id: '2', name: 'Bea', city: 'Lyon' },
  { id: '1', name: 'Ada', city: 'London' },
];

describe('DataTable', () => {
  it('sorts rows from the column header', async () => {
    render(<DataTable columns={columns} data={people} getRowId={(row) => row.id} />);
    const user = userEvent.setup();
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Bea');
    await user.click(screen.getByRole('button', { name: 'Name' }));
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Ada');
  });

  it('stacks the primary field on a narrow screen', () => {
    window.matchMedia = (query: string) => ({
      matches: query.includes('768'),
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    });
    render(<DataTable columns={columns} data={people} getRowId={(row) => row.id} />);
    expect(screen.getByText('Bea')).toBeInTheDocument();
    expect(screen.getAllByText('Details').length).toBeGreaterThan(0);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
