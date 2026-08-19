import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { Icon } from './icon'

/**
 * КНОПКИ в геометрии ADATA: высоты 32 / 40 / 44px, скругление 12px,
 * полужирный текст 14px, плоская заливка. Теней нет — глубина держится
 * на цвете и границе.
 *
 * Варианты *-nav — для кнопок внутри каркаса. Шапка у ADATA белая,
 * поэтому от основных они отличаются только источником токенов.
 */
const buttonVariants = cva(
  cn(
    'inline-flex select-none items-center justify-center whitespace-nowrap border font-semibold',
    'transition-colors duration-fast ease-decelerate',
    'disabled:pointer-events-none disabled:opacity-45',
  ),
  {
    variants: {
      variant: {
        primary:
          'focus-ring bg-primary text-primary-fg border-transparent hover:bg-primary-hover active:bg-primary-active',
        secondary:
          'focus-ring bg-surface text-content border-hairline-strong hover:bg-surface-muted hover:border-content-faint active:bg-surface-muted',
        danger:
          'focus-ring bg-danger-600 text-white border-transparent hover:bg-danger-500 active:bg-danger-700',
        ghost:
          'focus-ring bg-transparent text-content-muted border-transparent hover:bg-surface-muted hover:text-content active:bg-surface-muted',
        subtle:
          'focus-ring bg-accent-soft text-accent-strong border-accent-line hover:bg-brand-100 active:bg-brand-200',
        link: 'focus-ring bg-transparent text-accent-fg border-transparent underline-offset-2 hover:underline hover:text-accent-strong px-0',
        /** Синоним primary: свечение из прежней системы убрано */
        beam: 'focus-ring bg-primary text-primary-fg border-transparent hover:bg-primary-hover active:bg-primary-active',
        /* ── Внутри каркаса ── */
        'primary-nav':
          'focus-ring-nav bg-primary text-primary-fg border-transparent hover:bg-primary-hover active:bg-primary-active',
        'secondary-nav':
          'focus-ring-nav bg-surface text-nav-fg border-nav-line hover:bg-nav-hover active:bg-nav-hover',
        'ghost-nav':
          'focus-ring-nav bg-transparent text-nav-subtle border-transparent hover:bg-nav-hover hover:text-nav-fg',
      },
      size: {
        // Высоты и радиусы ADATA: h-8 / h-10 / h-11, скругление 12px
        sm: 'h-control-sm gap-1.5 rounded-sm px-3 text-sm',
        md: 'h-control gap-2 rounded px-4 text-sm',
        lg: 'h-control-lg gap-2 rounded px-5 text-sm',
        'icon-sm': 'h-control-sm w-control-sm rounded-sm',
        icon: 'h-control w-control rounded-sm',
        'icon-lg': 'h-control-lg w-control-lg rounded',
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
