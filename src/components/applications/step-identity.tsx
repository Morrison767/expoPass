'use client'

import { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { Card } from '@/components/ui/card'
import { Button, IconButton } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Icon } from '@/components/ui/icon'
import { FileDrop } from '@/components/ui/file-drop'
import { toast } from '@/components/ui/toast'
import { EdsDialog } from './eds-dialog'
import { fileToThumbnail, isAcceptedDocument, MAX_FILE_SIZE } from '@/lib/image'
import { formatDateTime, formatFileSize } from '@/lib/format'
import type { ApplicationFormValues } from '@/lib/application-schema'
import type { Attachment } from '@/lib/types'

/**
 * ШАГ 3 — ПОДТВЕРЖДЕНИЕ ЛИЧНОСТИ (п. 8.5 ТЗ).
 *
 * Взаимоисключающее правило:
 *   резидент РК     → ЭЦП обязательна, паспорт не нужен;
 *   нерезидент РК   → паспорт обязателен, ЭЦП РК не требуется.
 *
 * Переключение чекбокса меняет весь блок целиком и с анимацией — на демонстрации
 * это правило должно читаться сразу, без объяснений.
 */
export function StepIdentity({
  applicantName,
  documentSummary,
}: {
  applicantName: string
  documentSummary: Array<{ label: string; value: string }>
}) {
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ApplicationFormValues>()

  const isNonResident = watch('isNonResident')
  const signature = watch('edsSignature')
  const attachments = watch('attachments')
  const passport = attachments.find((f) => f.kind === 'passport')

  const [edsOpen, setEdsOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function uploadPassport(files: File[]) {
    const file = files[0]
    if (!file) return

    if (!isAcceptedDocument(file)) {
      toast.warning('Формат не поддерживается', 'Допустимы PDF, JPG, JPEG и PNG')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.warning('Файл слишком большой', `${formatFileSize(file.size)} — предел 10 МБ`)
      return
    }

    setBusy(true)
    try {
      const dataUrl = await fileToThumbnail(file)
      const next: Attachment = {
        id: `att-${Math.random().toString(36).slice(2, 9)}`,
        fileName: file.name,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        kind: 'passport',
        dataUrl: dataUrl || undefined,
      }
      // Паспорт всегда один: новая загрузка заменяет прежнюю
      setValue('attachments', [...attachments.filter((f) => f.kind !== 'passport'), next], {
        shouldValidate: true,
      })
      toast.success('Документ приложен', file.name)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Переключатель резидентства */}
      <Card
        className={cn(
          'transition-colors duration-base',
          isNonResident ? 'border-signal-200' : 'border-accent-line',
        )}
      >
        <div
          className={cn(
            'border-b px-4 py-2.5 transition-colors duration-base',
            isNonResident ? 'border-signal-200 bg-signal-50' : 'border-accent-line bg-accent-soft',
          )}
        >
          <h2
            className={cn(
              'text-2xs font-semibold uppercase tracking-label',
              isNonResident ? 'text-signal-800' : 'text-accent-strong',
            )}
          >
            Способ подтверждения заявителя
          </h2>
        </div>

        <div className="px-4 py-3.5">
          <Controller
            control={control}
            name="isNonResident"
            render={({ field }) => (
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-hairline bg-surface-sunken px-3 py-3 transition-colors hover:bg-surface-muted">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                  className="mt-0.5"
                />
                <span className="min-w-0">
                  <span className="block text-md font-semibold text-content">
                    Я являюсь нерезидентом Республики Казахстан
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-content-faint">
                    Признак определяет, чем подтверждается заявка перед отправкой
                  </span>
                </span>
              </label>
            )}
          />

          {/* Наглядное сравнение двух веток правила */}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <RuleCard
              active={!isNonResident}
              icon="pen"
              title="Резидент РК"
              rule="ЭЦП обязательна"
              detail="Паспорт прикладывать не нужно"
            />
            <RuleCard
              active={isNonResident}
              icon="id-card"
              title="Нерезидент РК"
              rule="Паспорт обязателен"
              detail="ЭЦП Республики Казахстан не требуется"
              signal
            />
          </div>
        </div>
      </Card>

      {/* Ветка правила: ЭЦП либо паспорт */}
      <AnimatePresence mode="wait">
        {!isNonResident ? (
          <motion.div
            key="eds"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className={signature ? 'border-status-confirmed-border' : undefined}>
              <div
                className={cn(
                  'flex items-center gap-2 border-b px-4 py-2.5',
                  signature
                    ? 'border-status-confirmed-border bg-status-confirmed-soft'
                    : 'border-hairline-soft bg-surface-sunken',
                )}
              >
                <Icon
                  name={signature ? 'check-circle' : 'pen'}
                  size={14}
                  className={signature ? 'text-status-confirmed-base' : 'text-content-faint'}
                />
                <h2
                  className={cn(
                    'text-2xs font-semibold uppercase tracking-label',
                    signature ? 'text-status-confirmed-text' : 'text-content-subtle',
                  )}
                >
                  Подписание ЭЦП
                </h2>
              </div>

              <div className="px-4 py-4">
                {signature ? (
                  <div>
                    <div className="flex items-start gap-3">
                      <motion.span
                        initial={{ scale: 0.7 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-status-confirmed-border bg-status-confirmed-soft text-status-confirmed-base"
                      >
                        <Icon name="check" size={22} strokeWidth={2.4} />
                      </motion.span>
                      <div className="min-w-0">
                        <p className="text-md font-semibold text-content">Заявка подписана ЭЦП</p>
                        <p className="mt-0.5 text-base text-content-subtle">
                          Подписано {formatDateTime(signature.signedAt)}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-3 grid gap-x-5 gap-y-2 rounded-md border border-hairline bg-surface-sunken px-3 py-2.5 sm:grid-cols-2">
                      <SignRow label="Владелец сертификата" value={signature.certificateSubject} />
                      <SignRow label="Серийный номер" value={signature.certificateSerial} mono />
                      <SignRow label="Хэш документа" value={`${signature.dataHash.slice(0, 24)}…`} mono />
                      <SignRow label="Действителен до" value="18.08.2027" />
                    </dl>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        size="md"
                        iconLeft="refresh"
                        onClick={() => setEdsOpen(true)}
                      >
                        Подписать заново
                      </Button>
                      <p className="text-xs text-content-faint">
                        Изменение данных заявки после подписания потребует повторной ЭЦП
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-accent-line bg-accent-soft text-accent-fg shadow-beam-sm">
                      <Icon name="pen" size={22} />
                    </span>
                    <p className="mt-3 text-md font-medium text-content">
                      Подпишите заявку электронной цифровой подписью
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-base leading-relaxed text-content-subtle">
                      Система сформирует неизменяемое представление данных, проверит сертификат и
                      сохранит результат подписи вместе с версией заявки.
                    </p>
                    <Button
                      variant="primary"
                      size="lg"
                      iconLeft="pen"
                      className="mt-4"
                      onClick={() => setEdsOpen(true)}
                    >
                      Подписать ЭЦП
                    </Button>

                    {errors.edsSignature ? (
                      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-status-conflict-text">
                        <Icon name="alert-circle" size={12} />
                        Без успешной подписи переход к следующему шагу заблокирован
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="passport"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className={passport ? 'border-status-confirmed-border' : 'border-signal-200'}>
              <div
                className={cn(
                  'flex items-center gap-2 border-b px-4 py-2.5',
                  passport
                    ? 'border-status-confirmed-border bg-status-confirmed-soft'
                    : 'border-signal-200 bg-signal-50',
                )}
              >
                <Icon
                  name={passport ? 'check-circle' : 'id-card'}
                  size={14}
                  className={passport ? 'text-status-confirmed-base' : 'text-signal-700'}
                />
                <h2
                  className={cn(
                    'text-2xs font-semibold uppercase tracking-label',
                    passport ? 'text-status-confirmed-text' : 'text-signal-800',
                  )}
                >
                  Документ, удостоверяющий личность — обязательно
                </h2>
              </div>

              <div className="px-4 py-4">
                <div className="mb-3 flex items-start gap-2 rounded-md border border-accent-line bg-accent-soft px-3 py-2.5">
                  <Icon name="info" size={14} className="mt-0.5 shrink-0 text-accent-fg" />
                  <p className="text-base font-medium text-accent-strong">
                    ЭЦП не требуется для нерезидентов РК
                  </p>
                </div>

                {passport ? (
                  <div className="flex flex-wrap items-start gap-3 rounded-md border border-status-confirmed-border bg-status-confirmed-soft p-3">
                    {passport.dataUrl ? (
                      <div className="h-24 w-20 shrink-0 overflow-hidden rounded border border-hairline bg-surface">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={passport.dataUrl} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <span className="flex h-24 w-20 shrink-0 items-center justify-center rounded border border-hairline bg-surface text-content-faint">
                        <Icon name="file-text" size={22} />
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-md font-semibold text-status-confirmed-text">
                        <Icon name="check" size={15} strokeWidth={2.4} />
                        Документ приложен
                      </p>
                      <p className="mt-1 truncate font-mono text-xs text-status-confirmed-text">
                        {passport.fileName}
                      </p>
                      <p className="mt-0.5 text-2xs tabular-nums text-status-confirmed-text">
                        {formatFileSize(passport.size)}
                      </p>
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-content-muted">
                        <Icon name="lock" size={11} className="mt-0.5 shrink-0" />
                        Хранится в защищённом хранилище, не публикуется на QR-странице; просмотр
                        и скачивание журналируются.
                      </p>
                    </div>

                    <IconButton
                      icon="trash"
                      label="Удалить документ"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() =>
                        setValue(
                          'attachments',
                          attachments.filter((f) => f.kind !== 'passport'),
                          { shouldValidate: true },
                        )
                      }
                    />
                  </div>
                ) : (
                  <>
                    <FileDrop
                      accept="image/jpeg,image/png,application/pdf"
                      disabled={busy}
                      onFiles={uploadPassport}
                      icon="id-card"
                      title={busy ? 'Обработка…' : 'Загрузите копию, скан или фото паспорта'}
                      hint="Перетащите файл сюда или выберите: PDF, JPG, JPEG, PNG · до 10 МБ"
                    />
                    {errors.attachments ? (
                      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-status-conflict-text">
                        <Icon name="alert-circle" size={12} />
                        Без приложенного паспорта переход к следующему шагу заблокирован
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <EdsDialog
        open={edsOpen}
        onOpenChange={setEdsOpen}
        applicantName={applicantName}
        documentSummary={documentSummary}
        onSigned={(result) => {
          setValue('edsSignature', result, { shouldValidate: true })
          toast.success('Заявка подписана ЭЦП', 'Подпись привязана к текущей версии данных')
        }}
      />
    </div>
  )
}

/* ─────────────── Карточка правила ─────────────── */

function RuleCard({
  active,
  icon,
  title,
  rule,
  detail,
  signal = false,
}: {
  active: boolean
  icon: string
  title: string
  rule: string
  detail: string
  signal?: boolean
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md border px-3 py-2.5 transition-all duration-base',
        active
          ? signal
            ? 'border-signal-300 bg-signal-50'
            : 'border-accent bg-accent-soft'
          : 'border-hairline bg-surface opacity-55',
      )}
    >
      {active ? (
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-y-0 left-0 w-rail',
            signal ? 'bg-signal-500' : 'bg-accent shadow-beam-sm',
          )}
        />
      ) : null}

      <div className="flex items-center gap-2 pl-1.5">
        <Icon
          name={icon}
          size={15}
          className={active ? (signal ? 'text-signal-700' : 'text-accent-fg') : 'text-content-faint'}
        />
        <p
          className={cn(
            'text-base font-semibold',
            active ? (signal ? 'text-signal-900' : 'text-accent-strong') : 'text-content-subtle',
          )}
        >
          {title}
        </p>
        {active ? (
          <span className="ml-auto text-2xs font-semibold uppercase tracking-label text-content-faint">
            применяется
          </span>
        ) : null}
      </div>

      <p
        className={cn(
          'mt-1 pl-1.5 text-md font-bold',
          active ? (signal ? 'text-signal-900' : 'text-accent-strong') : 'text-content-faint',
        )}
      >
        {rule}
      </p>
      <p className="mt-0.5 pl-1.5 text-xs text-content-subtle">{detail}</p>
    </div>
  )
}

function SignRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-2xs font-semibold uppercase tracking-label text-content-faint">{label}</dt>
      <dd className={cn('truncate text-base text-content', mono && 'font-mono text-xs')}>{value}</dd>
    </div>
  )
}
