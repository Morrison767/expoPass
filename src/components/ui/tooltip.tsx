'use client'

import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Подсказка на наведение и фокус.
 *
 * Обёртка перехватывает события на себе, а не на дочернем элементе:
 * disabled-кнопка не порождает pointer-событий, а объяснить, почему она
 * недоступна, нужно именно на ней.
 */
export function Tooltip({
  content,
  side = 'top',
  children,
  className,
}: {
  content: ReactNode
  side?: 'top' | 'bottom'
  children: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
    >
      {children}
      {open ? (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute left-1/2 z-dropdown w-max max-w-[16rem] -translate-x-1/2 animate-scale-in',
            'rounded border border-hairline bg-surface-inverse px-2 py-1 text-xs leading-snug text-content-inverse shadow-lg',
            side === 'top' ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]',
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  )
}
