import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function RowActions({ label, children }: { label: string; children: ReactNode }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="icon-button" type="button" aria-label={label}>
          <MoreHorizontal size={18} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="dropdown-menu" align="end" sideOffset={6}>
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function RowAction({
  children,
  to,
  onSelect,
  destructive = false,
}: {
  children: ReactNode;
  to?: string;
  onSelect?: () => void;
  destructive?: boolean;
}) {
  const className = destructive ? 'dropdown-item dropdown-item--danger' : 'dropdown-item';
  if (to)
    return (
      <DropdownMenu.Item asChild>
        <Link className={className} to={to}>
          {children}
        </Link>
      </DropdownMenu.Item>
    );
  return (
    <DropdownMenu.Item className={className} onSelect={onSelect}>
      {children}
    </DropdownMenu.Item>
  );
}

export function RowActionSeparator() {
  return <DropdownMenu.Separator className="dropdown-separator" />;
}
