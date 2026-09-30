import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

// TanStack Table types rows as Record<string, any>.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TableRow = Record<string, any>;

export interface DataColumn<T extends TableRow> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: 'start' | 'end';
  mobile?: 'primary' | 'secondary' | 'hidden';
}

function useCompact() {
  const query = '(max-width: 768px)';
  const [compact, setCompact] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setCompact(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return compact;
}

export function DataTable<T extends TableRow>({
  columns,
  data,
  getRowId,
  pageSize = 8,
  empty,
  loading = false,
}: {
  columns: DataColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  pageSize?: number;
  empty?: ReactNode;
  loading?: boolean;
}) {
  const { t } = useTranslation('banking');
  const compact = useCompact();
  const helper = useMemo(() => createColumnHelper<typeof features, T>(), []);
  const tableColumns = useMemo(
    () =>
      helper.columns(
        columns.map((column) =>
          helper.accessor((row) => String(column.sortValue?.(row) ?? ''), {
            id: column.id,
            header: column.header,
            enableSorting: Boolean(column.sortValue),
            cell: (context) => column.cell(context.row.original),
          }),
        ),
      ),
    [columns, helper],
  );
  const table = useTable({
    features,
    columns: tableColumns,
    data,
    getRowId,
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });
  const rows = table.getRowModel().rows;

  if (loading) return <div className="loading-stack" role="status" aria-label={t('common:loading')} />;
  if (data.length === 0) return <>{empty}</>;

  return (
    <div className="data-table">
      {compact ? (
        <div className="data-table__mobile">
          {rows.map((row) => (
            <article className="record" key={row.id}>
              {columns
                .filter((column) => column.mobile !== 'hidden' && column.mobile !== 'secondary')
                .map((column) => (
                  <div key={column.id}>{column.cell(row.original)}</div>
                ))}
              {columns.some((column) => column.mobile === 'secondary') && (
                <details>
                  <summary>{t('showDetails')}</summary>
                  {columns
                    .filter((column) => column.mobile === 'secondary')
                    .map((column) => (
                      <p key={column.id}>
                        <span>{column.header}</span> {column.cell(row.original)}
                      </p>
                    ))}
                </details>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="table-wrap data-table__desktop">
          <table>
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => {
                    const column = columns.find((item) => item.id === header.column.id);
                    return (
                      <th key={header.id} className={column?.align === 'end' ? 'money-cell' : undefined}>
                        {header.column.getCanSort() ? (
                          <button type="button" className="table-sort" onClick={() => header.column.toggleSorting()}>
                            {header.column.columnDef.header as string}
                          </button>
                        ) : (
                          (header.column.columnDef.header as string)
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {row.getAllCells().map((cell) => {
                    const column = columns.find((item) => item.id === cell.column.id);
                    return (
                      <td key={cell.id} className={column?.align === 'end' ? 'money-cell' : undefined}>
                        <table.FlexRender cell={cell} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {table.getPageCount() > 1 && (
        <div className="table-pager">
          <button
            type="button"
            className="button button--secondary button--small"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t('previous')}
          </button>
          <span>{t('pageStatus', { page: table.state.pagination.pageIndex + 1, pages: table.getPageCount() })}</span>
          <button
            type="button"
            className="button button--secondary button--small"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t('next')}
          </button>
        </div>
      )}
    </div>
  );
}
