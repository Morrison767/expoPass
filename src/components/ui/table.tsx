import * as React from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './icon'

/**
 * ТАБЛИЦА / РЕЕСТР. Плотная строка, шапка на утопленной поверхности,
 * заголовки колонок — CAPS-метки с трекингом. Цифры табличные (tnum),
 * чтобы количества и даты выстраивались по разрядам — требование реестров.
 */
export function TableWrap({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('overflow-hidden rounded-md border border-hairline bg-surface shadow-card', className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  function Table({ className, ...props }, ref) {
    return <table ref={ref} className={cn('w-full border-collapse text-left', className)} {...props} />
  },
)

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(function TableHeader({ className, ...props }, ref) {
  return <thead ref={ref} className={cn('bg-surface-sunken', className)} {...props} />
})

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(function TableBody({ className, ...props }, ref) {
  return <tbody ref={ref} className={className} {...props} />
})

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean }
>(function TableRow({ className, interactive, ...props }, ref) {
  return (
    <tr
      ref={ref}
      className={cn(
        'relative border-b border-hairline-soft last:border-0',
        interactive && 'cursor-pointer transition-colors duration-fast hover:bg-surface-sunken',
        className,
      )}
      {...props}
    />
  )
})

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(function TableHead({ className, ...props }, ref) {
  return (
    <th
      ref={ref}
      className={cn(
        'h-row whitespace-nowrap border-b border-hairline px-3 text-2xs font-semibold uppercase tracking-label text-content-faint',
        className,
      )}
      {...props}
    />
  )
})

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(function TableCell({ className, ...props }, ref) {
  return <td ref={ref} className={cn('h-row-lg px-3 text-base text-content-muted', className)} {...props} />
})

/** Строка-заглушка при пустом результате */
export function TableEmpty({
  colSpan,
  icon = 'inbox',
  title,
  hint,
}: {
  colSpan: number
  icon?: string
  title: string
  hint?: string
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-12">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-md border border-hairline bg-surface-sunken text-content-faint">
            <Icon name={icon} size={18} />
          </span>
          <p className="text-md font-medium text-content">{title}</p>
          {hint ? <p className="max-w-sm text-base text-content-faint">{hint}</p> : null}
        </div>
      </td>
    </tr>
  )
}

/** Панель над таблицей: поиск и фильтры слева — действия справа */
export function TableToolbar({
  left,
  right,
  className,
}: {
  left?: React.ReactNode
  right?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 border-b border-hairline bg-surface-sunken px-3 py-2.5',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">{left}</div>
      {right ? <div className="flex flex-wrap items-center gap-2">{right}</div> : null}
    </div>
  )
}
