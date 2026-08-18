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
import { useAppStore, useCurrentUser, selectObjectAdminQueue } from '@/store/app-store'
import { OPERATIONS } from '@/design/statuses'
import { formatDate, formatDateTime, pluralWithCount } from '@/lib/format'
import type { Application } from '@/lib/types'

/**
 * ОЧЕРЕДЬ АДМИНИСТРАТОРА ОБЪЕКТА — шаг 2 маршрута (п. 8.8 ТЗ).
 *
 * Показываются только заявки по закреплённым объектам. Решение можно
 * принять прямо из очереди либо открыть карточку с полным составом:
 * таблицей ТМЦ, фотографиями и подтверждением личности.
 *
 * После решения строка уходит из очереди с анимацией — видно, что
 * работа сделана, и не нужно искать, что изменилось.
 */
export default function ObjectAdminQueuePage() {
  const router = useRouter()
  const user = useCurrentUser()
  const activeRole = useAppStore((s) => s.activeRole)
  const applications = useAppStore((s) => s.applications)
  const objects = useAppStore((s) => s.objects)

  const approveByObjectAdmin = useAppStore((s) => s.approveByObjectAdmin)
  const returnForRevision = useAppStore((s) => s.returnForRevision)
  const rejectApplication = useAppStore((s) => s.rejectApplication)

  const [decision, setDecision] = useState<{ kind: DecisionKind; app: Application } | null>(null)

  if (!user) return null

  const objectName = (id: string) => objects.find((o) => o.id === id)?.nameRu ?? '—'

  // Суперадминистратор видит все ожидающие заявки, администратор — свои объекты
  const queue =
    activeRole === 'super_admin'
      ? applications.filter((a) => a.status === 'pending_object_admin')
      : selectObjectAdminQueue(applications, user)

  const myObjects = objects.filter((o) => user.objectIds.includes(o.id))
  const decidedByMe = applications.filter((a) => a.objectAdminId === user.id && a.approvedAt)

  function approve(app: Application) {
    approveByObjectAdmin(app.id)
    toast.success(
      'Заявка согласована',
      `${app.applicationNumber} передана в Главный оперативный центр`,
    )
  }

  function confirmDecision(kind: DecisionKind, comment: string) {
    if (!decision) return
    const { app } = decision

    if (kind === 'return') {
      returnForRevision(app.id, comment)
      toast.warning('Возвращена на доработку', `${app.applicationNumber} — заявитель уведомлён`)
    } else if (kind === 'reject') {
      rejectApplication(app.id, comment)
      toast.danger('Заявка отклонена', `${app.applicationNumber} — причина зафиксирована`)
    }
    setDecision(null)
  }

  return (
    <>
      <PageHeader
        icon="clock"
        title="Заявки на согласование"
        subtitle={
          activeRole === 'super_admin'
            ? 'Все заявки, ожидающие решения администратора объекта'
            : 'Материальные пропуска по закреплённым за вами объектам'
        }
      />

      <PageBody className="space-y-4">
        <section className="grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Ждут решения"
            value={queue.length}
            icon="clock"
            chip="review"
            hint="Заявки в вашей очереди"
          />
          <StatTile
            label="Мои объекты"
            value={myObjects.length}
            icon="building"
            hint={myObjects.length ? myObjects.map((o) => o.nameRu).slice(0, 3).join(', ') : undefined}
          />
          <StatTile
            label="Согласовано"
            value={decidedByMe.length}
            icon="check"
            chip="paid"
            hint="За всё время работы"
          />
        </section>

        {/* Очередь: элементы уходят с анимацией после решения */}
        <div className="grid gap-2.5">
          <AnimatePresence initial={false} mode="popLayout">
            {queue.map((app) => {
              const passport = app.attachments.find((f) => f.kind === 'passport')
              const photos = app.items.reduce((sum, item) => sum + item.photos.length, 0)

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
                    {/* Тело карточки — переход к полному составу заявки */}
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
                          {app.isNonResident ? (
                            <Badge tone="signal" size="sm" icon="id-card">
                              Нерезидент · паспорт
                            </Badge>
                          ) : (
                            <Badge tone="navy" size="sm" icon="pen">
                              ЭЦП
                            </Badge>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-content-faint">
                          Поступила {formatDateTime(app.updatedAt)}
                        </span>
                      </div>

                      <p className="mt-2.5 line-clamp-2 text-base text-content-muted">{app.basis}</p>

                      <MetaGrid columns={4} className="mt-3 border-t border-hairline-soft pt-3">
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

                      {/* Краткий состав ТМЦ и миниатюры — решение без перехода */}
                      <div className="mt-3 rounded border border-hairline bg-surface-sunken px-2.5 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-2xs font-semibold uppercase tracking-label text-content-faint">
                            {pluralWithCount(app.items.length, ['позиция', 'позиции', 'позиций'])} ТМЦ
                          </p>
                          <span className="flex items-center gap-2">
                            {photos ? (
                              <span className="inline-flex items-center gap-1 text-2xs text-content-faint">
                                <Icon name="paperclip" size={10} />
                                фото: {photos}
                              </span>
                            ) : null}
                            {passport ? (
                              <span className="inline-flex items-center gap-1 text-2xs text-signal-700">
                                <Icon name="lock" size={10} />
                                паспорт приложен
                              </span>
                            ) : null}
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-center gap-2">
                          {app.items
                            .flatMap((item) => item.photos)
                            .slice(0, 4)
                            .map((photo) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={photo.id}
                                src={photo.dataUrl}
                                alt=""
                                className="h-9 w-9 shrink-0 rounded border border-hairline object-cover"
                              />
                            ))}
                          <p className="line-clamp-2 min-w-0 flex-1 text-base text-content-muted">
                            {app.items.map((i) => `${i.name} — ${i.quantity} ${i.unit}`).join('; ')}
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Три решения по п. 8.8: согласовать, вернуть, отклонить */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline-soft bg-surface-sunken px-4 py-2.5">
                      <Button variant="ghost" size="md" iconLeft="eye" asChild>
                        <Link href={`/applications/view?id=${app.id}`}>Открыть карточку</Link>
                      </Button>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="secondary"
                          size="md"
                          iconLeft="refresh"
                          onClick={() => setDecision({ kind: 'return', app })}
                        >
                          Вернуть на доработку
                        </Button>
                        <Button
                          variant="danger"
                          size="md"
                          iconLeft="x-circle"
                          onClick={() => setDecision({ kind: 'reject', app })}
                        >
                          Отклонить
                        </Button>
                        <Button
                          variant="primary"
                          size="md"
                          iconLeft="check"
                          onClick={() => approve(app)}
                        >
                          Согласовать
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Пустая очередь */}
          {queue.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-status-confirmed-border bg-status-confirmed-soft text-status-confirmed-base">
                  <Icon name="check-double" size={18} />
                </span>
                <p className="text-md font-medium text-content">Очередь пуста</p>
                <p className="max-w-sm text-base text-content-faint">
                  Все поступившие заявки по вашим объектам рассмотрены.
                </p>
              </Card>
            </motion.div>
          ) : null}
        </div>
      </PageBody>

      <DecisionDialog
        kind={decision?.kind ?? null}
        applicationNumber={decision?.app.applicationNumber}
        onClose={() => setDecision(null)}
        onConfirm={confirmDecision}
      />
    </>
  )
}
