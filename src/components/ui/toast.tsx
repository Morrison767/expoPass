'use client'

import { useEffect } from 'react'
import { create } from 'zustand'
import { cn } from '@/lib/cn'
import { Icon } from './icon'

/**
 * ТОСТЫ — кратковременная обратная связь на действие.
 *
 * Отдельный слой от статусов сущностей: «система сообщает» — не то же,
 * что «объект находится в состоянии», поэтому палитра статусов здесь
 * переиспользуется осознанно и только для тона сообщения.
 *
 * Стор намеренно не персистится: тост живёт секунды.
 * Вызывается из любого обработчика: toast.success('Готово').
 */

export type ToastTone = 'success' | 'info' | 'warning' | 'danger'

export interface ToastItem {
  id: string
  tone: ToastTone
  title: string
  description?: string
}

interface ToastState {
  items: ToastItem[]
  push: (toast: Omit<ToastItem, 'id'>) => void
  dismiss: (id: string) => void
}

const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (toast) =>
    set((s) => ({
      items: [...s.items, { ...toast, id: `t-${Math.random().toString(36).slice(2, 9)}` }],
    })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}))

function show(tone: ToastTone, title: string, description?: string) {
  useToastStore.getState().push({ tone, title, description })
}

export const toast = {
  success: (title: string, description?: string) => show('success', title, description),
  info: (title: string, description?: string) => show('info', title, description),
  warning: (title: string, description?: string) => show('warning', title, description),
  danger: (title: string, description?: string) => show('danger', title, description),
}

const TONES: Record<ToastTone, { classes: string; icon: string; iconColor: string }> = {
  success: {
    classes: 'border-status-confirmed-border bg-status-confirmed-soft text-status-confirmed-text',
    icon: 'check-circle',
    iconColor: 'text-status-confirmed-base',
  },
  info: {
    classes: 'border-status-paid-border bg-status-paid-soft text-status-paid-text',
    icon: 'info',
    iconColor: 'text-status-paid-base',
  },
  warning: {
    classes: 'border-status-review-border bg-status-review-soft text-status-review-text',
    icon: 'alert-triangle',
    iconColor: 'text-status-review-base',
  },
  danger: {
    classes: 'border-status-conflict-border bg-status-conflict-soft text-status-conflict-text',
    icon: 'alert-circle',
    iconColor: 'text-status-conflict-base',
  },
}

/** Контейнер тостов — монтируется один раз в каркасе приложения */
export function Toaster() {
  const items = useToastStore((s) => s.items)

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-toast flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  )
}

function ToastCard({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss)
  const tone = TONES[item.tone]

  // Автоскрытие; сообщения об ошибке держим дольше
  useEffect(() => {
    const timeout = window.setTimeout(() => dismiss(item.id), item.tone === 'danger' ? 7000 : 4500)
    return () => window.clearTimeout(timeout)
  }, [item.id, item.tone, dismiss])

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex animate-slide-in-up items-start gap-2.5 rounded-md border px-3 py-2.5 shadow-lg',
        tone.classes,
      )}
    >
      <Icon name={tone.icon} size={15} className={cn('mt-0.5 shrink-0', tone.iconColor)} />
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium leading-snug">{item.title}</p>
        {item.description ? (
          <p className="mt-0.5 text-xs leading-snug opacity-90">{item.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        aria-label="Закрыть уведомление"
        className="focus-ring -mr-0.5 -mt-0.5 shrink-0 rounded-sm p-0.5 opacity-60 transition-opacity hover:opacity-100"
      >
        <Icon name="x" size={13} />
      </button>
    </div>
  )
}
