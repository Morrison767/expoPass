import { cn } from '@/lib/cn'
import { getStatusMeta, getStatusColors, ACCOUNT_STATUSES } from '@/design/statuses'
import { Icon } from './icon'
import type { ApplicationStatus, AccountStatus } from '@/lib/types'
import type { StatusToken } from '@/design/tokens'

/**
 * ═══════════════════════════════════════════════════════════════
 *  СВЕТЯЩАЯСЯ КРОМКА + СТАТУСНЫЙ БЕЙДЖ — подписная деталь системы
 * ═══════════════════════════════════════════════════════════════
 *
 * StatusRail — кромка 3px слева от любого объекта, несущего статус:
 * карточка заявки, строка реестра, слайд-панель. Кромка светится своим
 * тоном — читается как индикатор на приборе.
 *
 * Доступность: цвет никогда не работает один. Бейдж всегда несёт
 * иконку-форму + текстовую метку, а «отклонена» дополнительно получает
 * диагональную штриховку — читается в ч/б и при любой цветовой слепоте.
 */

/* Статические классы — Tailwind должен видеть их в исходниках */
const SOFT: Record<StatusToken, string> = {
  draft: 'bg-status-draft-soft border-status-draft-border text-status-draft-text',
  review: 'bg-status-review-soft border-status-review-border text-status-review-text',
  confirmed: 'bg-status-confirmed-soft border-status-confirmed-border text-status-confirmed-text',
  conflict: 'bg-status-conflict-soft border-status-conflict-border text-status-conflict-text',
  paid: 'bg-status-paid-soft border-status-paid-border text-status-paid-text',
  unpaid: 'bg-status-unpaid-soft border-status-unpaid-border text-status-unpaid-text',
  done: 'bg-status-done-soft border-status-done-border text-status-done-text',
  void: 'bg-status-void-soft border-status-void-border text-status-void-text',
}

const SOLID: Record<StatusToken, string> = {
  draft: 'bg-status-draft-base border-status-draft-base text-white',
  review: 'bg-status-review-base border-status-review-base text-white',
  confirmed: 'bg-status-confirmed-base border-status-confirmed-base text-white',
  conflict: 'bg-status-conflict-base border-status-conflict-base text-white',
  paid: 'bg-status-paid-base border-status-paid-base text-white',
  unpaid: 'bg-status-unpaid-base border-status-unpaid-base text-white',
  done: 'bg-status-done-base border-status-done-base text-white',
  void: 'bg-status-void-base border-status-void-base text-white',
}

const OUTLINE: Record<StatusToken, string> = {
  draft: 'bg-surface border-status-draft-border text-status-draft-text',
  review: 'bg-surface border-status-review-border text-status-review-text',
  confirmed: 'bg-surface border-status-confirmed-border text-status-confirmed-text',
  conflict: 'bg-surface border-status-conflict-border text-status-conflict-text',
  paid: 'bg-surface border-status-paid-border text-status-paid-text',
  unpaid: 'bg-surface border-status-unpaid-border text-status-unpaid-text',
  done: 'bg-surface border-status-done-border text-status-done-text',
  void: 'bg-surface border-status-void-border text-status-void-text',
}

const ICON_COLOR: Record<StatusToken, string> = {
  draft: 'text-status-draft-base',
  review: 'text-status-review-base',
  confirmed: 'text-status-confirmed-base',
  conflict: 'text-status-conflict-base',
  paid: 'text-status-paid-base',
  unpaid: 'text-status-unpaid-base',
  done: 'text-status-done-base',
  void: 'text-status-void-base',
}

const RAIL_BG: Record<StatusToken, string> = {
  draft: 'bg-status-draft-base',
  review: 'bg-status-review-base',
  confirmed: 'bg-status-confirmed-base',
  conflict: 'bg-status-conflict-base',
  paid: 'bg-status-paid-base',
  unpaid: 'bg-status-unpaid-base',
  done: 'bg-status-done-base',
  void: 'bg-status-void-base',
}

const RAIL_TEXT: Record<StatusToken, string> = {
  draft: 'text-status-draft-base',
  review: 'text-status-review-base',
  confirmed: 'text-status-confirmed-base',
  conflict: 'text-status-conflict-base',
  paid: 'text-status-paid-base',
  unpaid: 'text-status-unpaid-base',
  done: 'text-status-done-base',
  void: 'text-status-void-base',
}

const BADGE_SIZES = {
  sm: 'h-[18px] gap-1 rounded-sm px-1.5 text-2xs tracking-normal',
  md: 'h-5.5 gap-1.5 rounded px-2 text-xs',
  lg: 'h-6 gap-1.5 rounded px-2.5 text-base',
}

const BADGE_ICON_SIZE = { sm: 10, md: 12, lg: 13 }

export interface StatusBadgeProps {
  status: ApplicationStatus
  label?: string
  size?: keyof typeof BADGE_SIZES
  variant?: 'soft' | 'solid' | 'outline'
  withIcon?: boolean
  /** Короткая метка вместо полной — для плотных таблиц */
  short?: boolean
  className?: string
}

/** Бейдж статуса заявки. Подложка и текст переключаются темой автоматически. */
export function StatusBadge({
  status,
  label,
  size = 'md',
  variant = 'soft',
  withIcon = true,
  short = false,
  className,
}: StatusBadgeProps) {
  const meta = getStatusMeta(status)
  const token = meta.token
  const palette = variant === 'solid' ? SOLID : variant === 'outline' ? OUTLINE : SOFT

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center border font-medium leading-none',
        palette[token],
        BADGE_SIZES[size],
        className,
      )}
      title={meta.description}
    >
      {withIcon ? (
        <Icon
          name={meta.icon}
          size={BADGE_ICON_SIZE[size]}
          strokeWidth={1.8}
          className={variant === 'solid' ? 'text-white' : ICON_COLOR[token]}
        />
      ) : null}
      <span className="truncate">{label ?? (short ? meta.shortLabel : meta.label)}</span>
    </span>
  )
}

/** Бейдж статуса учётной записи — та же палитра, свой словарь */
export function AccountStatusBadge({
  status,
  size = 'md',
  className,
}: {
  status: AccountStatus
  size?: keyof typeof BADGE_SIZES
  className?: string
}) {
  const meta = ACCOUNT_STATUSES[status]
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center border font-medium leading-none',
        SOFT[meta.token],
        BADGE_SIZES[size],
        className,
      )}
    >
      <Icon
        name={meta.icon}
        size={BADGE_ICON_SIZE[size]}
        strokeWidth={1.8}
        className={ICON_COLOR[meta.token]}
      />
      <span className="truncate">{meta.label}</span>
    </span>
  )
}

/**
 * Светящаяся кромка. Растягивается по высоте родителя (родителю нужен `relative`).
 * Для «отклонена» включается диагональная штриховка.
 * `glow={false}` — для плотных списков, где 40 свечений создали бы шум.
 */
export function StatusRail({
  status,
  className,
  rounded = true,
  glow = true,
}: {
  status: ApplicationStatus
  className?: string
  rounded?: boolean
  glow?: boolean
}) {
  const meta = getStatusMeta(status)
  const colors = getStatusColors(status)
  const isRejected = status === 'rejected'

  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-y-0 left-0 w-rail',
        isRejected ? cn('hazard-stripes', RAIL_TEXT[meta.token]) : RAIL_BG[meta.token],
        rounded && 'rounded-l-[5px]',
        className,
      )}
      style={glow ? { boxShadow: `0 0 10px 0 ${colors.glow}` } : undefined}
    />
  )
}

/** Точка статуса — легенды и плотные списки */
export function StatusDot({
  status,
  size = 8,
  withLabel = false,
  glow = true,
  className,
}: {
  status: ApplicationStatus
  size?: number
  withLabel?: boolean
  glow?: boolean
  className?: string
}) {
  const meta = getStatusMeta(status)
  const colors = getStatusColors(status)

  const dot = (
    <span
      aria-hidden="true"
      className={cn('inline-block shrink-0 rounded-full', RAIL_BG[meta.token], className)}
      style={{
        width: size,
        height: size,
        boxShadow: glow ? `0 0 8px 0 ${colors.glow}` : undefined,
      }}
    />
  )

  if (!withLabel) return dot

  return (
    <span className="inline-flex items-center gap-1.5">
      {dot}
      <span className="text-xs text-content-muted">{meta.label}</span>
    </span>
  )
}
