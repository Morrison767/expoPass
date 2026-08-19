'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { BrandLock } from '@/components/layout/brand'
import { useAppStore, todayIso } from '@/store/app-store'
import { OPERATIONS } from '@/design/statuses'
import { formatDateLong, pluralWithCount } from '@/lib/format'
import type { Application } from '@/lib/types'

/**
 * ПУБЛИЧНАЯ ПРОВЕРКА ПРОПУСКА ПО QR (п. 8.11 ТЗ).
 *
 * Страница доступна без авторизации и показывает минимально необходимый
 * состав сведений. ИИН, номер и файл паспорта, телефон, e-mail и иные
 * избыточные персональные данные здесь не отображаются.
 */

type Verdict = 'valid' | 'expired' | 'cancelled' | 'not_found'

const VERDICTS: Record<Verdict, { label: string; icon: string; classes: string; note: string }> = {
  valid: {
    label: 'ДЕЙСТВИТЕЛЕН',
    icon: 'check-circle',
    classes: 'border-status-confirmed-border bg-status-confirmed-soft text-status-confirmed-text',
    note: 'Пропуск зарегистрирован и действует в указанную дату',
  },
  expired: {
    label: 'ИСТЁК',
    icon: 'calendar-x',
    classes: 'border-status-done-border bg-status-done-soft text-status-done-text',
    note: 'Дата действия документа завершилась',
  },
  cancelled: {
    label: 'АННУЛИРОВАН',
    icon: 'ban',
    classes: 'border-status-void-border bg-status-void-soft text-status-void-text',
    note: 'Документ отменён уполномоченным лицом',
  },
  not_found: {
    label: 'НЕ НАЙДЕН',
    icon: 'alert-triangle',
    classes: 'border-status-conflict-border bg-status-conflict-soft text-status-conflict-text',
    note: 'Документ с указанным номером в реестре отсутствует',
  },
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  )
}

function VerifyContent() {
  const searchParams = useSearchParams()
  const applications = useAppStore((s) => s.applications)
  const objects = useAppStore((s) => s.objects)
  const theme = useAppStore((s) => s.theme)

  const [number, setNumber] = useState('')
  const [checked, setChecked] = useState<{ verdict: Verdict; application?: Application } | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true))
    if (useAppStore.persist.hasHydrated()) setHydrated(true)
    return unsub
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Номер может прийти из QR-кода параметром запроса
  useEffect(() => {
    const fromQuery = searchParams.get('n')
    if (fromQuery && hydrated) {
      setNumber(fromQuery)
      setChecked(verify(fromQuery))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, searchParams])

  function verify(value: string): { verdict: Verdict; application?: Application } {
    const normalized = value.trim().toUpperCase()
    const found = applications.find(
      (a) => a.registrationNumber && a.registrationNumber.toUpperCase() === normalized,
    )
    if (!found) return { verdict: 'not_found' }
    if (found.status === 'cancelled') return { verdict: 'cancelled', application: found }
    if (found.status === 'expired' || found.validDate < todayIso())
      return { verdict: 'expired', application: found }
    if (found.status === 'registered') return { verdict: 'valid', application: found }
    return { verdict: 'not_found' }
  }

  const objectName = (id: string) => objects.find((o) => o.id === id)?.nameRu ?? '—'

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="on-nav relative flex h-topbar shrink-0 items-center justify-between gap-3 border-b border-nav-line bg-nav px-4 sm:px-6">
        <span aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
        <Link href="/" className="focus-ring-nav relative rounded">
          <BrandLock size={30} onDark subtitle="Проверка документа" />
        </Link>
        <Button variant="ghost-nav" size="sm" asChild>
          <Link href="/">На главную</Link>
        </Button>
        <span aria-hidden="true" className="beam-edge absolute inset-x-0 bottom-0" />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold text-content">Проверка материального пропуска</h1>
        <p className="mt-1.5 text-md text-content-subtle">
          Введите регистрационный номер документа или отсканируйте QR-код на пропуске.
        </p>

        <form
          className="mt-5 flex flex-wrap items-end gap-2 rounded-md border border-hairline bg-surface p-3.5 shadow-card"
          onSubmit={(e) => {
            e.preventDefault()
            setChecked(verify(number))
          }}
        >
          <div className="w-full flex-1 sm:min-w-[13rem]">
            <Field label="Регистрационный номер" htmlFor="reg-number">
              <Input
                id="reg-number"
                mono
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="МП-2026-000412"
                size="lg"
              />
            </Field>
          </div>
          <Button type="submit" variant="primary" size="lg" iconLeft="search" disabled={!number.trim()}>
            Проверить
          </Button>
        </form>

        {checked ? (
          <ResultCard result={checked} objectName={objectName} />
        ) : (
          <p className="mt-4 flex items-start gap-1.5 text-xs text-content-faint">
            <Icon name="lock" size={12} className="mt-0.5 shrink-0" />
            Страница показывает минимально необходимые сведения. ИИН, паспортные данные, телефон и
            адрес электронной почты не раскрываются.
          </p>
        )}
      </main>

      <footer className="border-t border-hairline bg-surface px-4 py-5 sm:px-6">
        <p className="mx-auto max-w-2xl text-xs text-content-faint">
          АО «НК «QazExpoCongress» · QazExpoPass · Прототип, данные демонстрационные
        </p>
      </footer>
    </div>
  )
}

function ResultCard({
  result,
  objectName,
}: {
  result: { verdict: Verdict; application?: Application }
  objectName: (id: string) => string
}) {
  const verdict = VERDICTS[result.verdict]
  const app = result.application

  return (
    <div className="mt-5 overflow-hidden rounded-md border border-hairline bg-surface shadow-card">
      {/* Вердикт крупно — читается с расстояния на КПП */}
      <div className={cn('flex items-center gap-3 border-b px-4 py-4', verdict.classes)}>
        <Icon name={verdict.icon} size={26} strokeWidth={1.8} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-2xl font-bold uppercase tracking-plate">{verdict.label}</p>
          <p className="mt-0.5 text-base">{verdict.note}</p>
        </div>
      </div>

      {app ? (
        <dl className="grid gap-x-5 gap-y-3.5 px-4 py-4 sm:grid-cols-2">
          <VerifyRow label="Регистрационный номер" value={app.registrationNumber ?? '—'} mono />
          <VerifyRow label="Дата действия" value={formatDateLong(app.validDate)} />
          <VerifyRow label="Операция" value={OPERATIONS[app.operation].label} />
          <VerifyRow label="Объект" value={objectName(app.objectId)} />
          <VerifyRow label="Организация" value={app.organization} />
          <VerifyRow label="Заявитель" value={maskName(app.applicantName)} />
          <VerifyRow
            label="Позиций ТМЦ"
            value={pluralWithCount(app.items.length, ['позиция', 'позиции', 'позиций'])}
          />
          <VerifyRow
            label="Подтверждение заявителя"
            value={app.isNonResident ? 'Документ, удостоверяющий личность' : 'ЭЦП'}
          />
        </dl>
      ) : (
        <div className="px-4 py-6">
          <p className="text-base text-content-subtle">
            Проверьте правильность номера. Он указан в верхней части документа и рядом с QR-кодом.
          </p>
        </div>
      )}
    </div>
  )
}

/** Ф.И.О. в допустимом объёме: фамилия и инициалы */
function maskName(fullName: string) {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  const initials = parts
    .slice(1)
    .map((part) => `${part[0]}.`)
    .join('')
  return `${parts[0]} ${initials}`
}

function VerifyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-2xs font-semibold uppercase tracking-label text-content-faint">{label}</dt>
      <dd className={cn('mt-0.5 text-md text-content', mono && 'font-mono')}>{value}</dd>
    </div>
  )
}
