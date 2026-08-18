'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { useOutsideClick } from '@/lib/hooks'
import { Icon } from './icon'
import { Checkbox } from './checkbox'

/**
 * Мультивыбор из справочника — фильтр по нескольким значениям сразу.
 * Геометрия триггера совпадает с Select, чтобы панель фильтров
 * выстраивалась в одну линию.
 */
export interface MultiSelectOption {
  value: string
  label: string
  /** Необязательный слот слева — точка статуса, иконка */
  adornment?: React.ReactNode
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Все значения',
  label,
  size = 'md',
  className,
}: {
  options: MultiSelectOption[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  label: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useOutsideClick(() => setOpen(false), open)

  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option])
  }

  const summary =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? (options.find((o) => o.value === value[0])?.label ?? placeholder)
        : `Выбрано: ${value.length}`

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className={cn(
          'focus-ring flex w-full items-center justify-between gap-2 border bg-surface text-content transition-all duration-fast',
          'hover:border-content-faint focus:border-accent focus:shadow-beam-sm',
          size === 'sm' ? 'h-control-sm rounded-sm px-2 text-xs' : 'h-control rounded px-2.5 text-base',
          open ? 'border-accent shadow-beam-sm' : 'border-hairline-strong',
        )}
      >
        <span className={cn('min-w-0 truncate text-left', !value.length && 'text-content-faint')}>
          {summary}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {value.length > 1 ? (
            <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent-soft px-1 text-2xs font-semibold tabular-nums text-accent-strong">
              {value.length}
            </span>
          ) : null}
          <Icon name="chevron-down" size={14} className="text-content-faint" />
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 top-[calc(100%+4px)] z-dropdown max-h-72 w-max min-w-full animate-scale-in overflow-y-auto rounded-md border border-hairline bg-surface p-1 shadow-lg"
        >
          {value.length ? (
            <button
              type="button"
              onClick={() => onChange([])}
              className="focus-ring mb-1 flex w-full items-center gap-1.5 rounded-sm px-2 py-1 text-xs text-accent-fg transition-colors hover:bg-surface-sunken"
            >
              <Icon name="x" size={11} />
              Сбросить выбор
            </button>
          ) : null}

          {options.map((option) => {
            const checked = value.includes(option.value)
            return (
              <label
                key={option.value}
                role="option"
                aria-selected={checked}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 transition-colors',
                  checked ? 'bg-accent-soft' : 'hover:bg-surface-sunken',
                )}
              >
                <Checkbox checked={checked} onCheckedChange={() => toggle(option.value)} />
                {option.adornment}
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-base',
                    checked ? 'font-medium text-accent-strong' : 'text-content-muted',
                  )}
                >
                  {option.label}
                </span>
              </label>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
