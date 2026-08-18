'use client'

import { useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { useOutsideClick } from '@/lib/hooks'
import { Icon } from './icon'

/**
 * Select с поиском — справочник объектов насчитывает 25 позиций,
 * и прокрутка по ним медленнее, чем набор пары символов.
 * Геометрия и фокус-луч совпадают с обычным Select.
 */
export interface ComboboxOption {
  value: string
  label: string
  hint?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Выберите значение',
  searchPlaceholder = 'Поиск…',
  emptyText = 'Ничего не найдено',
  invalid = false,
  size = 'md',
  id,
  className,
}: {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  invalid?: boolean
  size?: 'sm' | 'md' | 'lg'
  id?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const ref = useOutsideClick(() => {
    setOpen(false)
    setQuery('')
  }, open)

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  function choose(option: ComboboxOption) {
    onChange(option.value)
    setOpen(false)
    setQuery('')
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlight((h) => Math.min(filtered.length - 1, h + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((h) => Math.max(0, h - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const option = filtered[highlight]
      if (option) choose(option)
    }
  }

  const sizes = {
    sm: 'h-control-sm rounded-sm px-2 text-xs',
    md: 'h-control rounded px-2.5 text-base',
    lg: 'h-control-lg rounded-md px-3 text-md',
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        id={id}
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          setHighlight(0)
          window.setTimeout(() => searchRef.current?.focus(), 10)
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'focus-ring flex w-full items-center justify-between gap-2 border bg-surface text-content transition-all duration-fast',
          'hover:border-content-faint',
          sizes[size],
          open
            ? 'border-accent shadow-beam-sm'
            : invalid
              ? 'border-status-conflict-border'
              : 'border-hairline-strong',
        )}
      >
        <span className={cn('min-w-0 truncate text-left', !selected && 'text-content-faint')}>
          {selected?.label ?? placeholder}
        </span>
        <Icon name="chevron-down" size={14} className="shrink-0 text-content-faint" />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+4px)] z-dropdown w-full animate-scale-in overflow-hidden rounded-md border border-hairline bg-surface shadow-lg">
          <div className="relative border-b border-hairline-soft">
            <Icon
              name="search"
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-content-faint"
            />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setHighlight(0)
              }}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-control w-full bg-transparent pl-8 pr-2.5 text-base text-content outline-none placeholder:text-content-faint"
            />
          </div>

          <ul role="listbox" className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-2 py-3 text-center text-base text-content-faint">{emptyText}</li>
            ) : (
              filtered.map((option, index) => {
                const active = option.value === value
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => choose(option)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left transition-colors duration-fast',
                        active
                          ? 'bg-accent-soft font-medium text-accent-strong'
                          : index === highlight
                            ? 'bg-surface-sunken text-content'
                            : 'text-content-muted',
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-base">{option.label}</span>
                      {option.hint ? (
                        <span className="shrink-0 text-2xs text-content-faint">{option.hint}</span>
                      ) : null}
                      {active ? <Icon name="check" size={13} className="shrink-0 text-accent" /> : null}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
