'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { PageHeader, PageBody } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { toast } from '@/components/ui/toast'
import { StepData } from '@/components/applications/step-data'
import { StepItems } from '@/components/applications/step-items'
import { StepIdentity } from '@/components/applications/step-identity'
import { StepReview } from '@/components/applications/step-review'
import { StepSuccess } from '@/components/applications/step-success'
import { useAppStore, useCurrentUser, fullName } from '@/store/app-store'
import { OPERATIONS } from '@/design/statuses'
import { formatDateLong } from '@/lib/format'
import {
  applicationFormSchema,
  makeEmptyItem,
  STEP_FIELDS,
  type ApplicationFormValues,
} from '@/lib/application-schema'
import type { Application } from '@/lib/types'

/**
 * МАСТЕР ОФОРМЛЕНИЯ МАТЕРИАЛЬНОГО ПРОПУСКА (раздел 8 ТЗ).
 *
 * Пять шагов: данные → ТМЦ → подтверждение личности → проверка → отправка.
 * Состояние держит react-hook-form, проверку — zod по каждому шагу отдельно,
 * поэтому «Далее» блокируется ровно тем, что относится к текущему экрану,
 * а возврат назад ничего не теряет.
 *
 * Параметр `?from=<id>` предзаполняет форму из возвращённой заявки —
 * так работает кнопка «Исправить и отправить снова».
 */

const STEPS = [
  { key: 'data', label: 'Данные', icon: 'file-text' },
  { key: 'items', label: 'ТМЦ', icon: 'package' },
  { key: 'identity', label: 'Подтверждение личности', icon: 'pen' },
  { key: 'review', label: 'Проверка', icon: 'eye' },
  { key: 'submit', label: 'Отправка', icon: 'check' },
] as const

type StepKey = (typeof STEPS)[number]['key']

export default function NewApplicationPage() {
  return (
    <Suspense fallback={null}>
      <WizardContent />
    </Suspense>
  )
}

function WizardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useCurrentUser()
  const objects = useAppStore((s) => s.objects)
  const applications = useAppStore((s) => s.applications)
  const createApplication = useAppStore((s) => s.createApplication)

  const [step, setStep] = useState<StepKey>('data')
  /** Направление перехода — задаёт сторону, с которой выезжает экран */
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<Application | null>(null)

  /* Предзаполнение из возвращённой заявки */
  const source = useMemo(() => {
    const from = searchParams.get('from')
    if (!from) return null
    const found = applications.find((a) => a.id === from)
    return found && found.applicantId === user?.id ? found : null
  }, [searchParams, applications, user])

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    mode: 'onChange',
    defaultValues: source
      ? {
          operation: source.operation,
          objectId: source.objectId,
          validDate: source.validDate,
          basis: source.basis,
          workplace: source.workplace ?? user?.workplace ?? '',
          items: source.items.length ? source.items : [makeEmptyItem()],
          isNonResident: source.isNonResident,
          // Подпись не переносится: данные меняются, нужна повторная ЭЦП (п. 8.6 ТЗ)
          edsSignature: undefined,
          attachments: source.attachments.filter((f) => f.kind === 'passport'),
        }
      : {
          operation: undefined,
          objectId: '',
          validDate: '',
          basis: '',
          workplace: user?.workplace ?? '',
          items: [makeEmptyItem()],
          isNonResident: user?.isNonResident ?? false,
          edsSignature: undefined,
          attachments: [],
        },
  })

  const values = form.watch()
  const stepIndex = STEPS.findIndex((s) => s.key === step)

  /** Сводка подписываемых данных — показывается в окне ЭЦП */
  const documentSummary = useMemo(() => {
    const object = objects.find((o) => o.id === values.objectId)
    return [
      { label: 'Тип документа', value: 'Материальный пропуск' },
      { label: 'Операция', value: values.operation ? OPERATIONS[values.operation].label : '—' },
      { label: 'Объект', value: object?.nameRu ?? '—' },
      { label: 'Дата действия', value: values.validDate ? formatDateLong(values.validDate) : '—' },
      { label: 'Позиций ТМЦ', value: String(values.items?.length ?? 0) },
    ]
  }, [values.operation, values.objectId, values.validDate, values.items, objects])

  if (!user) return null

  async function goNext() {
    const fields = STEP_FIELDS[step as keyof typeof STEP_FIELDS]

    if (fields) {
      const valid = await form.trigger(fields as never, { shouldFocus: true })
      if (!valid) {
        toast.warning('Проверьте заполнение', 'Не все обязательные поля этого шага заполнены')
        return
      }
    }

    setDirection(1)
    setStep(STEPS[Math.min(STEPS.length - 1, stepIndex + 1)].key)
  }

  function goBack() {
    setDirection(-1)
    setStep(STEPS[Math.max(0, stepIndex - 1)].key)
  }

  function goToStep(target: StepKey) {
    const targetIndex = STEPS.findIndex((s) => s.key === target)
    setDirection(targetIndex > stepIndex ? 1 : -1)
    setStep(target)
  }

  /** Отправка: защита от двойного нажатия — кнопка гаснет до завершения */
  async function submit() {
    if (submitting) return

    const valid = await form.trigger()
    if (!valid) {
      toast.danger('Заявку нельзя отправить', 'Вернитесь к шагам и заполните обязательные поля')
      return
    }

    setSubmitting(true)
    try {
      const data = form.getValues()
      const object = objects.find((o) => o.id === data.objectId)
      const admin = useAppStore.getState().users.find((u) => u.id === object?.adminUserId)

      const id = createApplication({
        applicantId: user!.id,
        applicantName: fullName(user!),
        organization: user!.organization ?? 'АО «НК «QazExpoCongress»',
        workplace: data.workplace,
        operation: data.operation,
        objectId: data.objectId,
        basis: data.basis,
        validDate: data.validDate,
        items: data.items,
        attachments: data.attachments,
        isNonResident: data.isNonResident,
        confirmationMethod: data.isNonResident ? 'passport' : 'eds',
        edsSignature: data.edsSignature,
        status: 'pending_object_admin',
        objectAdminId: admin?.id,
        objectAdminName: admin ? fullName(admin) : undefined,
      })

      // Небольшая пауза: отправка должна ощущаться как действие, а не мгновение
      await new Promise((resolve) => setTimeout(resolve, 700))

      const saved = useAppStore.getState().applications.find((a) => a.id === id)
      if (saved) {
        setCreated(saved)
        setDirection(1)
        setStep('submit')
      }
    } catch {
      toast.danger('Не удалось отправить заявку', 'Повторите попытку')
    } finally {
      setSubmitting(false)
    }
  }

  const objectName = objects.find((o) => o.id === values.objectId)?.nameRu ?? '—'

  /* ── Экран успеха ── */
  if (step === 'submit' && created) {
    return (
      <>
        <PageHeader icon="check-circle" title="Заявка отправлена" />
        <PageBody>
          <StepSuccess application={created} objectName={objectName} />
        </PageBody>
      </>
    )
  }

  return (
    <FormProvider {...form}>
      <PageHeader
        icon="plus"
        title="Материальный пропуск"
        subtitle="Оформление разрешения на внос либо вынос товарно-материальных ценностей"
        actions={
          <Button variant="ghost" size="md" asChild>
            <Link href="/applications">Отмена</Link>
          </Button>
        }
        tabs={<ProgressBar current={stepIndex} onNavigate={goToStep} />}
      />

      <PageBody className="pb-24">
        {source ? (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-status-unpaid-border bg-status-unpaid-soft px-3 py-2.5">
            <Icon name="refresh" size={15} className="mt-0.5 shrink-0 text-status-unpaid-base" />
            <div className="min-w-0">
              <p className="text-base font-medium text-status-unpaid-text">
                Данные перенесены из заявки {source.applicationNumber}
              </p>
              <p className="mt-0.5 text-xs text-status-unpaid-text">
                {source.isNonResident
                  ? 'Приложенный паспорт сохранён. Внесите исправления по комментарию согласующего.'
                  : 'Подпись не переносится: после изменения данных потребуется повторная ЭЦП.'}
              </p>
            </div>
          </div>
        ) : null}

        {/* Экраны шагов с направленной анимацией */}
        <div className="relative overflow-x-clip">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -28 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 'data' ? <StepData user={user} objects={objects} /> : null}
              {step === 'items' ? <StepItems /> : null}
              {step === 'identity' ? (
                <StepIdentity applicantName={fullName(user)} documentSummary={documentSummary} />
              ) : null}
              {step === 'review' ? (
                <StepReview user={user} objects={objects} onEditStep={goToStep} />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </PageBody>

      {/* Нижняя панель навигации по шагам */}
      <div className="sticky bottom-0 z-sticky border-t border-hairline bg-surface px-4 py-2.5 shadow-lg sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="secondary"
            size="md"
            iconLeft="chevron-left"
            onClick={goBack}
            disabled={stepIndex === 0 || submitting}
          >
            Назад
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden text-xs text-content-faint sm:inline">
              Шаг {stepIndex + 1} из {STEPS.length - 1}
            </span>

            {step === 'review' ? (
              <Button
                variant="primary"
                size="lg"
                iconLeft="check"
                loading={submitting}
                disabled={submitting}
                onClick={submit}
              >
                {submitting ? 'Отправка…' : 'Отправить заявку'}
              </Button>
            ) : (
              <Button variant="primary" size="md" iconRight="chevron-right" onClick={goNext}>
                Далее
              </Button>
            )}
          </div>
        </div>
      </div>
    </FormProvider>
  )
}

/* ─────────────── Прогресс-бар ─────────────── */

function ProgressBar({
  current,
  onNavigate,
}: {
  current: number
  onNavigate: (step: StepKey) => void
}) {
  const visible = STEPS.slice(0, 4)

  return (
    <nav aria-label="Шаги оформления" className="relative pb-1">
      <ol className="flex items-center gap-1 overflow-x-auto">
        {visible.map((s, index) => {
          const active = index === current
          const done = index < current

          return (
            <li key={s.key} className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => (done ? onNavigate(s.key) : undefined)}
                disabled={!done && !active}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'focus-ring flex min-w-0 items-center gap-2 rounded px-1 py-1.5 text-left transition-colors duration-fast',
                  done && 'cursor-pointer hover:bg-surface-sunken',
                  !done && !active && 'cursor-default',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-2xs font-semibold tabular-nums transition-colors duration-base',
                    active
                      ? 'border-accent bg-accent text-content-inverse'
                      : done
                        ? 'border-status-confirmed-border bg-status-confirmed-soft text-status-confirmed-text'
                        : 'border-hairline-strong bg-surface text-content-faint',
                  )}
                >
                  {done ? <Icon name="check" size={11} strokeWidth={2.6} /> : index + 1}
                </span>
                <span
                  className={cn(
                    'hidden min-w-0 truncate text-xs md:block',
                    active ? 'font-semibold text-content' : done ? 'text-content-muted' : 'text-content-faint',
                  )}
                >
                  {s.label}
                </span>
              </button>

              {index < visible.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="relative h-px min-w-3 flex-1 overflow-hidden bg-hairline"
                >
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-accent"
                    initial={false}
                    animate={{ width: done ? '100%' : '0%' }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  />
                </span>
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
