import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { Icon } from './icon'

/**
 * КНОПКИ — геометрия и палитра перенесены из ИС учёта мероприятий.
 * Залитые получают верхний блик (shadow-button) — кромка читается как
 * фрезерованная. Фокус — луч, не серое кольцо. Оба варианта темы
 * обслуживаются одними классами: цвета приходят из семантических токенов.
 *
 * Варианты *-nav — для кнопок внутри каркаса (топбар, шапка панели).
 */
const buttonVariants = cva(
  cn(
    'inline-flex select-none items-center justify-center whitespace-nowrap border font-medium',
    'transition-all duration-fast ease-decelerate',
    'disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none',
  ),
  {
    variants: {
      variant: {
        primary:
          'focus-ring bg-primary text-primary-fg border-primary-line hover:bg-primary-hover active:bg-primary-active shadow-button',
        secondary:
          'focus-ring bg-surface-raised text-content border-hairline-strong hover:border-content-faint active:bg-surface-muted shadow-button-quiet',
        danger:
          'focus-ring bg-danger-600 text-white border-danger-800 hover:bg-danger-500 active:bg-danger-700 shadow-button',
        ghost:
          'focus-ring bg-transparent text-content-muted border-transparent hover:bg-surface-muted hover:text-content active:bg-surface-sunken',
        subtle:
          'focus-ring bg-accent-soft text-accent-strong border-accent-line hover:brightness-[0.97] active:brightness-95',
        link: 'focus-ring bg-transparent text-accent-fg border-transparent underline-offset-2 hover:underline hover:text-accent-strong px-0',
        /** Главный CTA сводных экранов: свет как призыв к действию */
        beam: 'focus-ring bg-accent text-content-inverse border-transparent hover:shadow-beam active:brightness-95 shadow-button',
        /* ── Внутри каркаса ── */
        'primary-nav':
          'focus-ring-nav bg-accent text-content-inverse border-transparent font-semibold hover:shadow-beam active:brightness-95 shadow-button',
        'secondary-nav':
          'focus-ring-nav bg-nav-hover text-nav-fg border-nav-line hover:border-hairline-strong active:brightness-95 shadow-button-quiet',
        'ghost-nav':
          'focus-ring-nav bg-transparent text-nav-subtle border-transparent hover:bg-nav-hover hover:text-nav-fg',
      },
      size: {
        sm: 'h-control-sm gap-1.5 rounded-sm px-2.5 text-xs',
        md: 'h-control gap-1.5 rounded px-3 text-base',
        lg: 'h-control-lg gap-2 rounded-md px-4 text-md',
        'icon-sm': 'h-control-sm w-control-sm rounded-sm',
        icon: 'h-control w-control rounded',
        'icon-lg': 'h-control-lg w-control-lg rounded-md',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'secondary', size: 'md', block: false },
  },
)

const ICON_SIZES: Record<string, number> = {
  sm: 13,
  md: 14,
  lg: 15,
  'icon-sm': 13,
  icon: 14,
  'icon-lg': 15,
}

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  iconLeft?: string
  iconRight?: string
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size,
    block,
    asChild = false,
    iconLeft,
    iconRight,
    loading = false,
    disabled,
    type = 'button',
    children,
    ...props
  },
  ref,
) {
  const Comp = asChild ? Slot : 'button'
  const iconSize = ICON_SIZES[size ?? 'md'] ?? 14

  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : type}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading ? (
            <Icon name="loader" size={iconSize} className="animate-spin" />
          ) : iconLeft ? (
            <Icon name={iconLeft} size={iconSize} />
          ) : null}
          {children}
          {iconRight && !loading ? <Icon name={iconRight} size={iconSize} /> : null}
        </>
      )}
    </Comp>
  )
})

/** Кнопка-иконка: квадратная геометрия + обязательная текстовая метка */
export interface IconButtonProps extends Omit<ButtonProps, 'iconLeft' | 'iconRight' | 'children'> {
  icon: string
  label: string
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant = 'ghost', size = 'icon', loading = false, className, ...props },
  ref,
) {
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      aria-label={label}
      title={label}
      className={className}
      {...props}
    >
      <Icon
        name={loading ? 'loader' : icon}
        size={ICON_SIZES[size as string] ?? 14}
        className={loading ? 'animate-spin' : undefined}
      />
    </Button>
  )
})

export { buttonVariants }
