'use client'

import Link from 'next/link'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/icon'
import { BrandLock } from '@/components/layout/brand'
import { OPERATIONS } from '@/design/statuses'
import { formatDateLong, pluralWithCount } from '@/lib/format'
import { VERDICTS, maskName, type Verdict } from '@/lib/verify'
import type { Application } from '@/lib/types'

/**
 * ПУБЛИЧНАЯ ПРОВЕРКА ПРОПУСКА (п. 8.11 ТЗ).
 *
 * Экран изолирован от кабинета: свой каркас, без бокового меню и без
 * авторизации. Состав сведений минимально необходимый — ИИН, паспорт,
 * телефон и адрес электронной почты здесь не отображаются никогда.
 */

/* ─────────────── Каркас публичной страницы ─────────────── */

export function VerifyShell({
  children,
  subtitle = 'Проверка документа',
}: {
  children: React.ReactNode
  subtitle?: string
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="on-nav relative flex h-topbar shrink-0 items-center justify-between gap-3 border-b border-nav-line bg-surface-nav px-4 sm:px-6">
        <span aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
        <Link href="/" className="focus-ring-nav relative rounded">
          <BrandLock size={30} onDark subtitle={subtitle} />
        </Link>
        <Link
          href="/"
          className="focus-ring-nav relative text-xs text-nav-subtle transition-colors hover:text-nav-fg"
        >
          На главную
        </Link>
        <span aria-hidden="true" className="beam-edge absolute inset-x-0 bottom-0" />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">{children}</main>

      <footer className="border-t border-hairline bg-surface px-4 py-5 sm:px-6">
        <p className="mx-auto max-w-2xl text-xs text-content-faint">
          АО «НК «QazExpoCongress» · QazExpoPass · Прототип, данные демонстрационные
        </p>
      </footer>
    </div>
  )
}

/* ─────────────── Карточка результата ─────────────── */

export function VerifyResult({
  verdict,
  application,
  objectName,
  number,
}: {
  verdict: Verdict
  application?: Application
  objectName?: string
  number?: string
}) {
  const meta = VERDICTS[verdict]

  return (
    <div className="overflow-hidden rounded-md border border-hairline bg-surface shadow-card">
      {/* Вердикт крупно — читается с расстояния на КПП */}
      <div className={cn('flex items-center gap-3 border-b px-4 py-5', meta.classes)}>
        <Icon name={meta.icon} size={30} strokeWidth={1.8} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-3xl font-bold uppercase leading-none tracking-plate">{meta.label}</p>
          <p className="mt-1.5 text-base">{meta.note}</p>
        </div>
      </div>

      {application ? (
        <dl className="grid gap-x-5 gap-y-3.5 px-4 py-4 sm:grid-cols-2">
          <Row label="Регистрационный номер" value={application.registrationNumber ?? '—'} mono />
          <Row label="Дата действия" value={formatDateLong(application.validDate)} />
          <Row label="Операция" value={OPERATIONS[application.operation].label} strong />
          <Row label="Объект" value={objectName ?? '—'} />
          <Row label="Организация" value={application.organization} />
          <Row label="Заявитель" value={maskName(application.applicantName)} />
          <Row
            label="Позиций ТМЦ"
            value={pluralWithCount(application.items.length, ['позиция', 'позиции', 'позиций'])}
          />
          <Row
            label="Подтверждение заявителя"
            value={application.isNonResident ? 'Документ, удостоверяющий личность' : 'ЭЦП'}
          />
        </dl>
      ) : (
        <div className="px-4 py-6">
          {number ? (
            <p className="mb-2 font-mono text-base text-content">Запрошенный номер: {number}</p>
          ) : null}
          <p className="text-base text-content-subtle">
            Проверьте правильность номера. Он указан в верхней части документа и рядом с QR-кодом.
          </p>
        </div>
      )}

      <p className="flex items-start gap-1.5 border-t border-hairline-soft bg-surface-sunken px-4 py-2.5 text-xs text-content-faint">
        <Icon name="lock" size={12} className="mt-0.5 shrink-0" />
        Страница показывает минимально необходимые сведения. ИИН, паспортные данные, телефон и
        адрес электронной почты не раскрываются.
      </p>
    </div>
  )
}

function Row({
  label,
  value,
  mono,
  strong,
}: {
  label: string
  value: string
  mono?: boolean
  strong?: boolean
}) {
  return (
    <div className="min-w-0">
      <dt className="text-2xs font-semibold uppercase tracking-label text-content-faint">{label}</dt>
      <dd
        className={cn(
          'mt-0.5 text-md text-content',
          mono && 'font-mono',
          strong && 'text-lg font-semibold uppercase tracking-plate',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

/* Реэкспорт логики: страницы импортируют всё из одного места */
export { resolveVerdict, maskName, VERDICTS, type Verdict } from '@/lib/verify'
