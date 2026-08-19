import { cn } from '@/lib/cn'

/**
 * ЗНАК СЕРВИСА. Собственного логотипа в брендовых ассетах Общества нет,
 * поэтому знак собран из той же геометрии, что бренд-блок ИС учёта
 * мероприятий: квадрат со скруглением 6px, акцентная подложка и
 * светящаяся кромка. Внутри — пропускной турникет-шеврон.
 */
export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md border border-accent-line bg-accent-soft text-accent-fg',
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size * 0.56}
        height={size * 0.56}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Створка пропускного пункта + отметка прохода */}
        <path d="M2.6 2.4v11.2M13.4 2.4v11.2" />
        <path d="M5.4 8h5.2" />
        <path d="M8.4 5.6L10.8 8l-2.4 2.4" />
      </svg>
    </span>
  )
}

/** Полный бренд-блок: знак + название сервиса и владельца */
export function BrandLock({
  size = 32,
  onDark = false,
  subtitle = 'Электронные пропуска',
  /** На узком экране оставляет только знак: подпись съедает ширину шапки */
  compact = false,
  className,
}: {
  size?: number
  onDark?: boolean
  subtitle?: string
  compact?: boolean
  className?: string
}) {
  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <BrandMark size={size} />
      <span className={cn('min-w-0', compact && 'hidden sm:block')}>
        <span
          className={cn(
            'block truncate text-md font-semibold leading-tight',
            onDark ? 'text-nav-fg' : 'text-content',
          )}
        >
          QazExpoPass
        </span>
        <span
          className={cn(
            'block truncate text-2xs uppercase tracking-label',
            onDark ? 'text-nav-subtle' : 'text-content-faint',
          )}
        >
          {subtitle}
        </span>
      </span>
    </span>
  )
}
