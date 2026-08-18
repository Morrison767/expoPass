import * as React from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './icon'
import { StatusRail } from './status'
import type { ApplicationStatus } from '@/lib/types'

/**
 * КАРТОЧКА — базовый контейнер для заявки, объекта, пользователя.
 *
 * Подписная структура (перенесена из ИС учёта мероприятий):
 *   [светящаяся кромка 3px] [табличка-идентификатор] Заголовок
 *                            подзаголовок · метаданные
 *                            ─────────────────────────
 *                            сетка полей с CAPS-метками
 *
 * Глубина — три слоя: микроградиент поверхности, фаска-блик 1px сверху
 * и мягкая ambient-тень (shadow-card). Плоских прямоугольников нет.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: ApplicationStatus
  interactive?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { status, interactive = false, className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden rounded-md border border-hairline bg-surface-raised shadow-card',
        status && 'pl-rail',
        interactive &&
          'focus-ring cursor-pointer text-left transition-all duration-base ease-decelerate hover:-translate-y-px hover:border-hairline-strong hover:shadow-card-hover',
        className,
      )}
      {...props}
    >
      {status ? <StatusRail status={status} /> : null}
      {children}
    </div>
  )
})

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return (
      <div ref={ref} className={cn('flex flex-col gap-2 px-4 pb-3 pt-3.5', className)} {...props} />
    )
  },
)

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  function CardTitle({ className, ...props }, ref) {
    return (
      <h3
        ref={ref}
        className={cn('truncate text-lg font-semibold leading-snug text-content', className)}
        {...props}
      />
    )
  },
)

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return <p ref={ref} className={cn('text-base text-content-subtle', className)} {...props} />
})

export const CardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { divided?: boolean }
>(function CardBody({ className, divided = true, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn('px-4 py-3', divided && 'border-t border-hairline-soft', className)}
      {...props}
    />
  )
})

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-wrap items-center justify-between gap-2 border-t border-hairline-soft bg-surface-sunken px-4 py-2.5',
          className,
        )}
        {...props}
      />
    )
  },
)

/** Сетка полей карточки: CAPS-метка сверху, значение снизу */
export function MetaGrid({
  columns = 2,
  className,
  children,
}: {
  columns?: 1 | 2 | 3 | 4
  className?: string
  children: React.ReactNode
}) {
  const cols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }
  return <dl className={cn('grid gap-x-4 gap-y-3', cols[columns], className)}>{children}</dl>
}

export function MetaItem({
  label,
  value,
  mono = false,
  icon,
  tone = 'default',
  className,
}: {
  label: string
  value?: React.ReactNode
  mono?: boolean
  icon?: string
  tone?: 'default' | 'muted' | 'strong' | 'accent'
  className?: string
}) {
  const tones = {
    default: 'text-content',
    muted: 'text-content-subtle',
    strong: 'text-content font-semibold',
    accent: 'text-accent-fg font-semibold',
  }

  return (
    <div className={cn('min-w-0', className)}>
      <dt className="mb-0.5 truncate text-2xs font-semibold uppercase tracking-label text-content-faint">
        {label}
      </dt>
      <dd className={cn('flex items-center gap-1.5 text-base tabular-nums', mono && 'font-mono', tones[tone])}>
        {icon ? <Icon name={icon} size={13} className="text-content-faint" /> : null}
        <span className="min-w-0 truncate">{value ?? '—'}</span>
      </dd>
    </div>
  )
}

/* Цветной чип иконки в приборной плитке */
const CHIP: Record<string, string> = {
  accent: 'bg-accent-soft text-accent-fg border-accent-line',
  confirmed: 'bg-status-confirmed-soft text-status-confirmed-text border-status-confirmed-border',
  review: 'bg-status-review-soft text-status-review-text border-status-review-border',
  conflict: 'bg-status-conflict-soft text-status-conflict-text border-status-conflict-border',
  paid: 'bg-status-paid-soft text-status-paid-text border-status-paid-border',
  unpaid: 'bg-status-unpaid-soft text-status-unpaid-text border-status-unpaid-border',
  done: 'bg-status-done-soft text-status-done-text border-status-done-border',
  neutral: 'bg-surface-muted text-content-subtle border-hairline',
}

/**
 * ПРИБОРНАЯ ПЛИТКА — показатель сводки.
 * Контраст кеглей 1:5 между CAPS-меткой (10px) и числом (44px, tabular,
 * отрицательный трекинг) делает сводку читаемой с трёх метров.
 */
export function StatTile({
  label,
  value,
  unit,
  icon,
  chip = 'accent',
  hint,
  onClick,
  className,
}: {
  label: string
  value: React.ReactNode
  unit?: string
  icon?: string
  chip?: keyof typeof CHIP
  hint?: string
  onClick?: () => void
  className?: string
}) {
  const Comp = onClick ? 'button' : 'div'

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-md border border-hairline bg-surface-raised p-3.5 text-left shadow-card',
        onClick &&
          'focus-ring group transition-all duration-base ease-decelerate hover:-translate-y-px hover:border-hairline-strong hover:shadow-card-hover',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {icon ? (
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded border',
                CHIP[chip] ?? CHIP.accent,
              )}
            >
              <Icon name={icon} size={14} />
            </span>
          ) : null}
          <span className="truncate text-2xs font-semibold uppercase tracking-label text-content-subtle">
            {label}
          </span>
        </div>
        {onClick ? (
          <Icon
            name="arrow-right"
            size={13}
            className="shrink-0 text-content-faint opacity-0 transition-opacity duration-fast group-hover:opacity-100"
          />
        ) : null}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-5xl font-semibold tabular-nums leading-none text-content">{value}</span>
        {unit ? <span className="text-base font-medium text-content-subtle">{unit}</span> : null}
      </div>

      {hint ? <p className="mt-2.5 truncate text-xs text-content-faint">{hint}</p> : null}
    </Comp>
  )
}

/**
 * HERO-ПОЛОСА — сводная панель во всю ширину.
 * В светлой теме — прохладный градиент с бирюзовым свечением,
 * в тёмной — корпус прибора. Точечная фактура + светящаяся кромка сверху.
 */
export function HeroPanel({
  children,
  className,
  grid = true,
  bloom = true,
}: {
  children: React.ReactNode
  className?: string
  grid?: boolean
  bloom?: boolean
}) {
  return (
    <div className={cn('on-nav relative overflow-hidden border-y border-hairline bg-hero', className)}>
      {grid ? (
        <span aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0 opacity-70" />
      ) : null}
      {bloom ? (
        <span aria-hidden="true" className="bloom-beam pointer-events-none absolute inset-0" />
      ) : null}
      <span aria-hidden="true" className="beam-edge-soft absolute inset-x-0 top-0" />
      <div className="relative">{children}</div>
    </div>
  )
}
