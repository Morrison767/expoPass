'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { PageHeader, PageBody } from '@/components/layout/page-header'
import { Card, MetaGrid, MetaItem, StatTile } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status'
import { Badge, Plate } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { toast } from '@/components/ui/toast'
import { DecisionDialog, type DecisionKind } from '@/components/applications/decision-dialog'
import { useAppStore, selectGocQueue, useCurrentUser } from '@/store/app-store'
import { OPERATIONS } from '@/design/statuses'
import { formatDate, formatDateTime, pluralWithCount } from '@/lib/format'
import type { Application } from '@/lib/types'

/**
 * ОЧЕРЕДЬ ГЛАВНОГО ОПЕРАТИВНОГО ЦЕНТРА — шаг 3 маршрута (п. 8.8 ТЗ).
 *
 * ГОЦ проверяет подтверждение заявителя, согласование администратора
 * объекта и комплектность, после чего выполняет финальную регистрацию:
 * присваивается уникальный номер, формируется PDF с QR-кодом, заявителю
 * уходит уведомление.
 */
export default function GocQueuePage() {
  const router = useRouter()
  const user = useCurrentUser()
  const applications = useAppStore((s) => s.applications)
  const objects = useAppStore((s) => s.objects)
  const users = useAppStore((s) => s.users)
  const registerByGoc = useAppStore((s) => s.registerByGoc)
  const cancelApplication = useAppStore((s) => s.cancelApplication)

  const [decision, setDecision] = useState<{ kind: DecisionKind; app: Application } | null>(null)

  const objectName = (id: string) => objects.find((o) => o.id === id)?.nameRu ?? '—'
  const queue = selectGocQueue(applications)
  const registered = applications.filter((a) => a.status === 'registered')

  function register(app: Application) {
    registerByGoc(app.id)
    const applicant = users.find((u) => u.id === app.applicantId)
    // Номер присваивается в сторе, поэтому читаем его после действия
    const saved = useAppStore.getState().applications.find((a) => a.id === app.id)

    toast.success(
      `Пропуск зарегистрирован · ${saved?.registrationNumber ?? ''}`,
      `PDF с QR-кодом сформирован и направлен на ${applicant?.email ?? 'адрес заявителя'}`,
    )
  }

  function confirmDecision(kind: DecisionKind, comment: string) {
    if (!decision || kind !== 'cancel') return
    cancelApplication(decision.app.id, comment)
    toast.danger('Пропуск аннулирован', `${decision.app.applicationNumber} — заявитель уведомлён`)
    setDecision(null)
  }

  if (!user) return null

  return (
    <>
      <PageHeader
        icon="stamp"
        title="Заявки на регистрацию"
        subtitle="Согласованные администратором объекта пропуска, ожидающие финальной регистрации"
      />

      <PageBody className="space-y-4">
        <section className="grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Ждут регистрации"
            value={queue.length}
            icon="stamp"
            chip="paid"
            hint="Согласованы, требуется присвоить номер"
          />
          <StatTile
            label="Действуют"
            value={registered.length}
            icon="check-double"
            chip="confirmed"
            hint="Зарегистрированные пропуска"
          />
          <StatTile
            label="Всего в реестре"
            value={applications.filter((a) => a.registrationNumber).length}
            icon="table"
            hint="Записей за всё время"
          />
        </section>

        <div className="grid gap-2.5">
          <AnimatePresence initial={false} mode="popLayout">
            {queue.map((app) => {
              const passport = app.attachments.find((f) => f.kind === 'passport')
              // Комплектность: подтверждение заявителя + согласование объекта
              const confirmationOk = app.isNonResident ? Boolean(passport) : Boolean(app.edsSignature)
              const routeOk = Boolean(app.approvedAt)
              const ready = confirmationOk && routeOk && app.items.length > 0

              return (
                <motion.div
                  key={app.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, scale: 0.97 }}
                  transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Card status={app.status}>
                    <button
                      type="button"
                      onClick={() => router.push(`/applications/view?id=${app.id}`)}
                      className="focus-ring block w-full px-4 py-3.5 text-left"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <Plate>{app.applicationNumber}</Plate>
                          <StatusBadge status={app.status} size="sm" short />
                          <Badge tone="outline" size="sm" icon={OPERATIONS[app.operation].icon}>
                            {OPERATIONS[app.operation].label}
                          </Badge>
                          <Badge
                            tone={app.isNonResident ? 'signal' : 'navy'}
                            size="sm"
                            icon={app.isNonResident ? 'id-card' : 'pen'}
                          >
                            {app.isNonResident ? 'Паспорт' : 'ЭЦП'}
                          </Badge>
                        </div>
                      </div>

                      {/* Отметка о согласовании: кто и когда */}
                      <div className="mt-3 flex flex-wrap items-center gap-2.5 rounded border border-status-paid-border bg-status-paid-soft px-3 py-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-status-paid-border bg-surface text-status-paid-base">
                          <Icon name="check" size={15} strokeWidth={2.2} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-2xs font-semibold uppercase tracking-label text-status-paid-text">
                            Согласовано администратором объекта
                          </p>
                          <p className="text-base font-medium text-status-paid-text">
                            {app.objectAdminName ?? '—'}
                            <span className="ml-2 font-normal tabular-nums">
                              {formatDateTime(app.approvedAt)}
                            </span>
                          </p>
                        </div>
                      </div>

                      <MetaGrid columns={4} className="mt-3">
                        <MetaItem label="Заявитель" value={app.applicantName} icon="user" />
                        <MetaItem label="Организация" value={app.organization} />
                        <MetaItem label="Объект" value={objectName(app.objectId)} icon="building" />
                        <MetaItem
                          label="Дата действия"
                          value={formatDate(app.validDate)}
                          icon="calendar"
                          tone="strong"
                        />
                      </MetaGrid>

                      {/* Контрольный список комплектности */}
                      <ul className="mt-3 grid gap-1.5 border-t border-hairline-soft pt-3 sm:grid-cols-3">
                        <CheckRow
                          ok={confirmationOk}
                          label={
                            app.isNonResident
                              ? 'Паспорт нерезидента приложен'
                              : 'Заявка подписана ЭЦП'
                          }
                        />
                        <CheckRow ok={routeOk} label="Согласование объекта получено" />
                        <CheckRow
                          ok={app.items.length > 0}
                          label={pluralWithCount(app.items.length, [
                            'позиция',
                            'позиции',
                            'позиций',
                          ])}
                        />
                      </ul>
                    </button>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline-soft bg-surface-sunken px-4 py-2.5">
                      <span className="text-xs text-content-faint">
                        При регистрации присваивается номер и формируется PDF с QR-кодом
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="ghost" size="md" iconLeft="eye" asChild>
                          <Link href={`/applications/view?id=${app.id}`}>Открыть карточку</Link>
                        </Button>
                        <Button
                          variant="primary"
                          size="md"
                          iconLeft="stamp"
                          disabled={!ready}
                          onClick={() => register(app)}
                        >
                          Зарегистрировать
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {queue.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-status-confirmed-border bg-status-confirmed-soft text-status-confirmed-base">
                  <Icon name="check-double" size={18} />
                </span>
                <p className="text-md font-medium text-content">Очередь пуста</p>
                <p className="max-w-sm text-base text-content-faint">
                  Все согласованные заявки зарегистрированы.
                </p>
              </Card>
            </motion.div>
          ) : null}
        </div>

        {/* Действующие пропуска — аннулирование доступно отсюда и из реестра */}
        {registered.length ? (
          <section>
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-content">Действующие пропуска</h2>
              <Button variant="link" size="sm" iconRight="arrow-right" asChild>
                <Link href="/registry">Открыть реестр</Link>
              </Button>
            </div>

            <div className="grid gap-2">
              <AnimatePresence initial={false} mode="popLayout">
                {registered.slice(0, 5).map((app) => (
                  <motion.div
                    key={app.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: 40, scale: 0.97 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Card status={app.status} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <Plate tone="accent">{app.registrationNumber}</Plate>
                      <span className="min-w-0 flex-1 truncate text-base text-content-muted">
                        {app.applicantName} · {objectName(app.objectId)} ·{' '}
                        {OPERATIONS[app.operation].label} · {formatDate(app.validDate)}
                      </span>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button variant="ghost" size="sm" iconLeft="eye" asChild>
                          <Link href={`/applications/view?id=${app.id}`}>Открыть</Link>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          iconLeft="ban"
                          onClick={() => setDecision({ kind: 'cancel', app })}
                        >
                          Аннулировать
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        ) : null}
      </PageBody>

      <DecisionDialog
        kind={decision?.kind ?? null}
        applicationNumber={decision?.app.registrationNumber ?? decision?.app.applicationNumber}
        onClose={() => setDecision(null)}
        onConfirm={confirmDecision}
      />
    </>
  )
}

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-start gap-1.5 text-base">
      <Icon
        name={ok ? 'check-circle' : 'alert-circle'}
        size={13}
        className={`mt-0.5 shrink-0 ${ok ? 'text-status-confirmed-base' : 'text-status-conflict-base'}`}
      />
      <span className={ok ? 'text-content-muted' : 'text-status-conflict-text'}>{label}</span>
    </li>
  )
}
