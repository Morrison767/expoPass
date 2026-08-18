'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status'
import { Plate } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { OPERATIONS } from '@/design/statuses'
import { formatDateLong, pluralWithCount } from '@/lib/format'
import type { Application } from '@/lib/types'

/**
 * ШАГ 5 — ЗАЯВКА ОТПРАВЛЕНА.
 *
 * Экран подтверждает три вещи: заявка принята, ей присвоен номер,
 * и понятно, что происходит дальше по маршруту.
 */
export function StepSuccess({
  application,
  objectName,
}: {
  application: Application
  objectName: string
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="relative flex flex-col items-center text-center">
        <Confetti />

        {/* Галочка с пружиной и расходящимся кольцом */}
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className="relative flex h-20 w-20 items-center justify-center rounded-full border border-status-confirmed-border bg-status-confirmed-soft text-status-confirmed-base"
        >
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border-2 border-status-confirmed-base"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.7, opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut', delay: 0.15 }}
          />
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.14, type: 'spring', stiffness: 340, damping: 16 }}
          >
            <Icon name="check" size={38} strokeWidth={2.4} />
          </motion.span>
        </motion.span>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <h1 className="mt-5 text-3xl font-semibold text-content">Заявка отправлена</h1>
          <p className="mt-2 max-w-lg text-md leading-relaxed text-content-subtle">
            Заявка зарегистрирована в системе и направлена администратору выбранного объекта.
            Уведомление о решении придёт в личный кабинет и на электронную почту.
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.32 }}
      >
        <Card status={application.status} className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline-soft bg-surface-sunken px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-2xs font-semibold uppercase tracking-label text-content-faint">
                Номер заявки
              </span>
              <Plate tone="accent">{application.applicationNumber}</Plate>
            </div>
            <StatusBadge status={application.status} size="lg" />
          </div>

          <dl className="grid gap-x-5 gap-y-3 px-4 py-3.5 sm:grid-cols-2">
            <Row label="Операция" value={OPERATIONS[application.operation].label} />
            <Row label="Объект" value={objectName} />
            <Row label="Дата действия" value={formatDateLong(application.validDate)} />
            <Row
              label="Позиций ТМЦ"
              value={pluralWithCount(application.items.length, ['позиция', 'позиции', 'позиций'])}
            />
            <Row
              label="Способ подтверждения"
              value={application.isNonResident ? 'Паспорт нерезидента' : 'ЭЦП'}
            />
            <Row
              label="Согласующий"
              value={application.objectAdminName ?? 'Будет назначен администратором объекта'}
            />
          </dl>
        </Card>

        {/* Что дальше по маршруту */}
        <Card className="mt-3">
          <div className="border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
            <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
              Что дальше
            </h2>
          </div>
          <ol className="px-4 py-3.5">
            {[
              {
                icon: 'check',
                done: true,
                title: 'Заявка отправлена',
                text: 'Данные подтверждены и переданы в работу',
              },
              {
                icon: 'clock',
                done: false,
                title: 'Согласование администратором объекта',
                text: 'Проверяются основание, объект, состав ТМЦ и комплектность',
              },
              {
                icon: 'stamp',
                done: false,
                title: 'Регистрация в Главном оперативном центре',
                text: 'Присваивается номер пропуска, формируется PDF с QR-кодом',
              },
              {
                icon: 'mail',
                done: false,
                title: 'Документ у вас',
                text: 'PDF доступен в личном кабинете и приходит на электронную почту',
              },
            ].map((step, index, all) => (
              <li key={step.title} className="relative flex gap-3 pb-4 last:pb-0">
                {index < all.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-[11px] top-6 h-full w-px bg-hairline"
                  />
                ) : null}
                <span
                  className={
                    step.done
                      ? 'relative z-base flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-status-confirmed-border bg-status-confirmed-soft text-status-confirmed-base'
                      : 'relative z-base flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-hairline bg-surface text-content-faint'
                  }
                >
                  <Icon name={step.icon} size={11} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-base font-medium text-content">{step.title}</p>
                  <p className="mt-0.5 text-xs leading-snug text-content-subtle">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button variant="primary" size="lg" iconRight="arrow-right" asChild>
            <Link href={`/applications/view?id=${application.id}`}>Перейти к заявке</Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/dashboard">Вернуться в кабинет</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-2xs font-semibold uppercase tracking-label text-content-faint">{label}</dt>
      <dd className="mt-0.5 truncate text-base text-content">{value}</dd>
    </div>
  )
}

/* ─────────────── Лёгкое конфетти ─────────────── */

const CONFETTI_COLORS = ['#0B7C93', '#1B3A6B', '#0D9488', '#F5A524', '#35D6F0']

/**
 * Короткий однократный салют: двенадцать частиц разлетаются и гаснут.
 * Уважает системную настройку «уменьшить движение».
 */
function Confetti() {
  const [pieces, setPieces] = useState<
    Array<{ id: number; x: number; y: number; rotate: number; color: string; delay: number }>
  >([])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    setPieces(
      Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2
        const distance = 90 + Math.random() * 60
        return {
          id: index,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 20,
          rotate: Math.random() * 360,
          color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
          delay: Math.random() * 0.12,
        }
      }),
    )
  }, [])

  if (!pieces.length) return null

  return (
    <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-10 h-0 w-0">
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute block h-1.5 w-1.5 rounded-[1px]"
          style={{ backgroundColor: piece.color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{
            x: piece.x,
            y: piece.y,
            opacity: 0,
            rotate: piece.rotate,
            scale: 0.6,
          }}
          transition={{ duration: 1.05, delay: piece.delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </span>
  )
}
