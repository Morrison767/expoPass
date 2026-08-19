import * as React from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './icon'

/**
 * Единая геометрия контролов input / select / textarea.
 * Фокус — луч (свечение + акцентная граница), а не серое кольцо.
 * Ошибка окрашивает границу токеном conflict, но текст ошибки обязателен:
 * цвет не единственный носитель смысла.
 */
const CONTROL_BASE = cn(
  'w-full appearance-none border bg-surface text-content transition-all duration-fast',
  'placeholder:text-content-faint',
  'hover:border-content-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20',
  'disabled:cursor-not-allowed disabled:border-hairline disabled:bg-surface-muted disabled:text-content-faint disabled:shadow-none',
  'read-only:bg-surface-sunken read-only:text-content-muted',
)

const CONTROL_SIZES = {
  sm: 'h-control-sm rounded-sm px-2.5 text-xs',
  md: 'h-control rounded px-3 text-base',
  lg: 'h-control-lg rounded-md px-3.5 text-md',
}

const TEXTAREA_SIZES = {
  sm: 'rounded-sm px-2 py-1.5 text-xs',
  md: 'rounded px-2.5 py-2 text-base',
  lg: 'rounded-md px-3 py-2.5 text-md',
}

type ControlSize = keyof typeof CONTROL_SIZES

function controlClasses(size: ControlSize, invalid?: boolean, extra?: string) {
  return cn(
    CONTROL_BASE,
    CONTROL_SIZES[size],
    invalid
      ? 'border-status-conflict-border hover:border-status-conflict-base focus:border-status-conflict-base'
      : 'border-hairline-strong',
    extra,
  )
}

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: ControlSize
  invalid?: boolean
  iconLeft?: string
  suffix?: React.ReactNode
  mono?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', invalid = false, iconLeft, suffix, mono = false, className, ...props },
  ref,
) {
  const hasLeft = Boolean(iconLeft)
  const hasRight = Boolean(suffix)

  const input = (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={controlClasses(
        size,
        invalid,
        cn(
          mono && 'font-mono tracking-tight',
          hasLeft && (size === 'sm' ? 'pl-7' : 'pl-8'),
          hasRight && 'pr-9',
          className,
        ),
      )}
      {...props}
    />
  )

  if (!hasLeft && !hasRight) return input

  return (
    <div className="relative flex items-center">
      {hasLeft ? (
        <Icon
          name={iconLeft!}
          size={size === 'sm' ? 13 : 14}
          className={cn('pointer-events-none absolute text-content-faint', size === 'sm' ? 'left-2' : 'left-2.5')}
        />
      ) : null}
      {input}
      {hasRight ? (
        <span className="pointer-events-none absolute right-2.5 text-xs text-content-faint">{suffix}</span>
      ) : null}
    </div>
  )
})

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: ControlSize
  invalid?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { size = 'md', invalid = false, className, rows = 3, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL_BASE,
        TEXTAREA_SIZES[size],
        'resize-y leading-relaxed',
        invalid ? 'border-status-conflict-border focus:border-status-conflict-base' : 'border-hairline-strong',
        className,
      )}
      {...props}
    />
  )
})

/**
 * Обёртка поля: метка, хинт, ошибка, признак обязательности.
 * Микро-метка в CAPS с трекингом — тот же «указательный» язык,
 * что в табличках объектов и заголовках таблиц.
 */
export function Field({
  label,
  hint,
  error,
  required = false,
  optional = false,
  htmlFor,
  labelSuffix,
  className,
  children,
}: {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  optional?: boolean
  htmlFor?: string
  labelSuffix?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <div className="flex items-baseline justify-between gap-2">
          <label
            htmlFor={htmlFor}
            className="text-2xs font-semibold uppercase tracking-label text-content-subtle"
          >
            {label}
            {required ? <span className="ml-1 text-danger-500">*</span> : null}
            {optional ? <span className="ml-1 font-normal text-content-faint">не обяз.</span> : null}
          </label>
          {labelSuffix}
        </div>
      ) : null}
      {children}
      {error ? (
        <p className="flex items-start gap-1 text-xs text-status-conflict-text">
          <Icon name="alert-circle" size={12} className="mt-px" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-xs text-content-faint">{hint}</p>
      ) : null}
    </div>
  )
}

export { controlClasses, CONTROL_BASE, CONTROL_SIZES }
