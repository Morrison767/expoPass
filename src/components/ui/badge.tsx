import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { Icon } from './icon'

/**
 * Нейтральный бейдж — для НЕстатусных признаков: категория пользователя,
 * роль, операция внос/вынос, объект размещения.
 * Статусы всегда через <StatusBadge> — палитра статусов не переиспользуется.
 */
const badgeVariants = cva(
  'inline-flex max-w-full items-center border font-medium leading-none',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-muted text-content-muted border-transparent',
        outline: 'bg-surface text-content-subtle border-hairline-strong',
        navy: 'bg-accent-soft text-accent-strong border-accent-line',
        signal: 'bg-signal-50 text-signal-800 border-signal-200',
        primary: 'bg-primary text-primary-fg border-primary-line',
      },
      size: {
        sm: 'h-5 gap-1 rounded-full px-2 text-2xs',
        md: 'h-6 gap-1.5 rounded-full px-2.5 text-xs',
        lg: 'h-7 gap-1.5 rounded-full px-3 text-base',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'md' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: string
}

export function Badge({ className, tone, size, icon, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
      {icon ? <Icon name={icon} size={size === 'sm' ? 10 : 12} /> : null}
      <span className="truncate">{children}</span>
    </span>
  )
}

/** Счётчик — для навигации, табов и очередей */
export function Counter({
  value,
  tone = 'neutral',
  className,
}: {
  value: React.ReactNode
  tone?: 'neutral' | 'beam' | 'danger' | 'signal'
  className?: string
}) {
  const tones = {
    neutral: 'bg-surface-muted text-content-subtle',
    beam: 'bg-accent-soft text-accent-strong',
    danger: 'bg-danger-600 text-white',
    signal: 'bg-signal-600 text-white',
  }
  return (
    <span
      className={cn(
        'inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-2xs font-semibold tabular-nums leading-none tracking-normal',
        tones[tone],
        className,
      )}
    >
      {value}
    </span>
  )
}

/**
 * Табличка-идентификатор — моноширинный код объекта или номер документа.
 * Тот же приём, что на навигационных табло комплекса.
 */
export function Plate({
  children,
  tone = 'default',
  className,
}: {
  children: React.ReactNode
  tone?: 'default' | 'accent'
  className?: string
}) {
  const tones = {
    default: 'border-transparent bg-surface-muted text-content-muted',
    accent: 'border-transparent bg-accent-soft text-accent-fg',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 font-mono text-2xs font-semibold tracking-plate',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export { badgeVariants }
