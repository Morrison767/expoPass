'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { formatDateTime } from '@/lib/format'

/**
 * ЭМУЛЯЦИЯ ПОДПИСАНИЯ ЭЦП (п. 8.6 ТЗ).
 *
 * Перед подписанием система показывает, ЧТО именно подписывается:
 * неизменяемое представление данных и его хэш. Затем — проверка
 * сертификата и фиксация результата.
 *
 * Реальный механизм (NCALayer, облачная подпись либо иной) согласовывается
 * с Заказчиком на этапе проектирования. Здесь воспроизведён порядок шагов
 * и состав сведений, которые система обязана сохранить.
 */

export interface EdsResult {
  signedAt: string
  certificateSubject: string
  certificateSerial: string
  dataHash: string
  validUntil: string
}

type Phase = 'preview' | 'checking' | 'done'

const CHECK_STEPS = [
  'Подключение к хранилищу сертификатов',
  'Проверка цепочки доверия',
  'Проверка статуса сертификата в OCSP',
  'Формирование подписи CMS',
]

export function EdsDialog({
  open,
  onOpenChange,
  applicantName,
  documentSummary,
  onSigned,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicantName: string
  /** Краткое описание подписываемого документа: операция, объект, дата, позиции */
  documentSummary: Array<{ label: string; value: string }>
  onSigned: (result: EdsResult) => void
}) {
  const [phase, setPhase] = useState<Phase>('preview')
  const [step, setStep] = useState(0)
  const [result, setResult] = useState<EdsResult | null>(null)

  /* Хэш подписываемых данных формируется до подписи и больше не меняется */
  const [dataHash] = useState(() => makeHash())

  useEffect(() => {
    if (!open) {
      // Сброс с задержкой, чтобы не мигало во время закрытия
      const timeout = window.setTimeout(() => {
        setPhase('preview')
        setStep(0)
        setResult(null)
      }, 200)
      return () => window.clearTimeout(timeout)
    }
  }, [open])

  useEffect(() => {
    if (phase !== 'checking') return

    // Последовательная проверка: четыре шага примерно за две секунды
    const timers = CHECK_STEPS.map((_, index) =>
      window.setTimeout(() => setStep(index + 1), (index + 1) * 480),
    )

    const finish = window.setTimeout(() => {
      const signed: EdsResult = {
        signedAt: new Date().toISOString(),
        certificateSubject: applicantName.toUpperCase(),
        certificateSerial: makeSerial(),
        dataHash,
        validUntil: '2027-08-18',
      }
      setResult(signed)
      setPhase('done')
    }, CHECK_STEPS.length * 480 + 320)

    return () => {
      timers.forEach(window.clearTimeout)
      window.clearTimeout(finish)
    }
  }, [phase, applicantName, dataHash])

  return (
    <Dialog open={open} onOpenChange={(next) => phase !== 'checking' && onOpenChange(next)}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Подписание электронной цифровой подписью</DialogTitle>
          <DialogDescription>
            Резидент Республики Казахстан подписывает сформированную заявку ЭЦП
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="min-h-[19rem]">
          <AnimatePresence mode="wait">
            {/* ── Что подписываем ── */}
            {phase === 'preview' ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                <div className="rounded-md border border-hairline bg-surface-sunken p-3">
                  <p className="text-2xs font-semibold uppercase tracking-label text-content-faint">
                    Подписываемые данные
                  </p>
                  <dl className="mt-2 space-y-1.5">
                    {documentSummary.map((row) => (
                      <div key={row.label} className="flex items-baseline justify-between gap-3">
                        <dt className="shrink-0 text-xs text-content-faint">{row.label}</dt>
                        <dd className="min-w-0 truncate text-right text-base text-content">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="rounded-md border border-hairline bg-surface p-3">
                  <p className="text-2xs font-semibold uppercase tracking-label text-content-faint">
                    Хэш документа · SHA-256
                  </p>
                  <p className="mt-1 break-all font-mono text-xs leading-relaxed text-content-muted">
                    {dataHash}
                  </p>
                </div>

                <p className="flex items-start gap-1.5 text-xs leading-relaxed text-content-faint">
                  <Icon name="info" size={12} className="mt-0.5 shrink-0" />
                  Подпись привязывается к этой версии заявки. Любое изменение существенных данных
                  после подписания потребует повторной ЭЦП.
                </p>
              </motion.div>
            ) : null}

            {/* ── Проверка сертификата ── */}
            {phase === 'checking' ? (
              <motion.div
                key="checking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col items-center justify-center py-6"
              >
                <span className="relative flex h-14 w-14 items-center justify-center">
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full border-2 border-accent-line border-t-accent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                  />
                  <Icon name="pen" size={20} className="text-accent-fg" />
                </span>

                <p className="mt-4 text-md font-medium text-content">Проверка сертификата…</p>

                <ul className="mt-4 w-full max-w-sm space-y-1.5">
                  {CHECK_STEPS.map((label, index) => {
                    const done = index < step
                    const current = index === step
                    return (
                      <li key={label} className="flex items-center gap-2 text-base">
                        <span
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                            done
                              ? 'border-status-confirmed-border bg-status-confirmed-soft text-status-confirmed-base'
                              : current
                                ? 'border-accent text-accent'
                                : 'border-hairline text-content-faint',
                          )}
                        >
                          {done ? (
                            <Icon name="check" size={9} strokeWidth={2.6} />
                          ) : current ? (
                            <motion.span
                              className="h-1.5 w-1.5 rounded-full bg-accent"
                              animate={{ opacity: [1, 0.3, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                          ) : null}
                        </span>
                        <span className={done || current ? 'text-content-muted' : 'text-content-faint'}>
                          {label}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </motion.div>
            ) : null}

            {/* ── Подпись успешна ── */}
            {phase === 'done' && result ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-3"
              >
                <div className="flex flex-col items-center py-2 text-center">
                  <motion.span
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-status-confirmed-border bg-status-confirmed-soft text-status-confirmed-base"
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                  >
                    <Icon name="check" size={26} strokeWidth={2.4} />
                  </motion.span>
                  <p className="mt-3 text-xl font-semibold text-content">Подпись успешна</p>
                  <p className="mt-0.5 text-base text-content-subtle">
                    Заявка подписана и готова к отправке
                  </p>
                </div>

                <div className="rounded-md border border-hairline bg-surface-sunken p-3">
                  <p className="text-2xs font-semibold uppercase tracking-label text-content-faint">
                    Сведения о сертификате
                  </p>
                  <dl className="mt-2 space-y-1.5">
                    <CertRow label="Владелец" value={result.certificateSubject} />
                    <CertRow label="ИИН" value="8••••••••317" mono />
                    <CertRow label="Серийный номер" value={result.certificateSerial} mono />
                    <CertRow label="Действителен до" value="18.08.2027" />
                    <CertRow label="Дата подписания" value={formatDateTime(result.signedAt)} />
                    <CertRow label="Издатель" value="ҰКО РК · НУЦ РК" />
                  </dl>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </DialogBody>

        <DialogFooter>
          {phase === 'preview' ? (
            <>
              <Button variant="ghost" size="md" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button variant="primary" size="md" iconLeft="pen" onClick={() => setPhase('checking')}>
                Подписать ЭЦП
              </Button>
            </>
          ) : null}

          {phase === 'checking' ? (
            <span className="text-xs text-content-faint">Не закрывайте окно до завершения…</span>
          ) : null}

          {phase === 'done' && result ? (
            <Button
              variant="primary"
              size="md"
              iconLeft="check"
              onClick={() => {
                onSigned(result)
                onOpenChange(false)
              }}
            >
              Готово
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CertRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-xs text-content-faint">{label}</dt>
      <dd className={cn('min-w-0 truncate text-right text-base text-content', mono && 'font-mono text-xs')}>
        {value}
      </dd>
    </div>
  )
}

/* Псевдослучайные значения — только для демонстрации */
function makeHash() {
  const chars = 'abcdef0123456789'
  return Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function makeSerial() {
  const chars = 'ABCDEF0123456789'
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
