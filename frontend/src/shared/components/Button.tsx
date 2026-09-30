import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'icon';

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const variantClass =
    variant === 'icon'
      ? 'icon-button'
      : `button${variant === 'secondary' ? ' button--secondary' : variant === 'ghost' ? ' button--ghost' : variant === 'destructive' ? ' button--danger' : ''}`;
  return <button data-variant={variant} className={`${variantClass} ${className}`.trim()} {...props} />;
}
