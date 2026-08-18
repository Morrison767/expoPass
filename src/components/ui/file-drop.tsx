'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './icon'

/**
 * Зона загрузки файлов: перетаскивание либо выбор через диалог.
 *
 * Реальной отправки на сервер нет — файл обрабатывается на клиенте
 * (уменьшается до миниатюры) и остаётся в состоянии формы.
 */
export function FileDrop({
  accept,
  multiple = false,
  onFiles,
  title,
  hint,
  icon = 'upload',
  compact = false,
  disabled = false,
  className,
}: {
  accept: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  title: string
  hint?: string
  icon?: string
  compact?: boolean
  disabled?: boolean
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(list: FileList | null) {
    if (!list?.length) return
    onFiles(Array.from(list))
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        setDragging(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (!disabled) handleFiles(e.dataTransfer.files)
      }}
      className={cn(
        'relative rounded-md border border-dashed text-center transition-all duration-fast',
        compact ? 'px-3 py-3' : 'px-4 py-6',
        disabled
          ? 'cursor-not-allowed border-hairline bg-surface-muted opacity-60'
          : dragging
            ? 'border-accent bg-accent-soft shadow-beam-sm'
            : 'border-hairline-strong bg-surface-sunken hover:border-content-faint',
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files)
          // Сброс, чтобы повторный выбор того же файла тоже сработал
          e.target.value = ''
        }}
        className="sr-only"
        aria-label={title}
      />

      <div className={cn('flex items-center justify-center gap-2.5', compact ? '' : 'flex-col')}>
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-md border transition-colors duration-fast',
            compact ? 'h-8 w-8' : 'h-10 w-10',
            dragging
              ? 'border-accent-line bg-surface text-accent-fg'
              : 'border-hairline bg-surface text-content-faint',
          )}
        >
          <Icon name={icon} size={compact ? 15 : 18} />
        </span>

        <div className={cn('min-w-0', compact && 'text-left')}>
          <p className={cn('font-medium text-content', compact ? 'text-base' : 'text-md')}>
            {dragging ? 'Отпустите файл' : title}
          </p>
          {hint ? <p className="mt-0.5 text-xs text-content-faint">{hint}</p> : null}
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className={cn(
            'focus-ring shrink-0 rounded border border-hairline-strong bg-surface-raised px-3 text-base font-medium text-content shadow-button-quiet transition-all duration-fast',
            'hover:border-content-faint active:bg-surface-muted',
            'disabled:pointer-events-none disabled:opacity-45',
            compact ? 'h-control-sm text-xs' : 'mt-1 h-control',
          )}
        >
          Выбрать файл
        </button>
      </div>
    </div>
  )
}
