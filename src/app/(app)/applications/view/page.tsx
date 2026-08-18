'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { PageHeader, PageBody } from '@/components/layout/page-header'
import { Card, MetaGrid, MetaItem } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/ui/status'
import { Badge, Counter, Plate } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea, Field } from '@/components/ui/input'
import { Icon } from '@/components/ui/icon'
import { Tooltip } from '@/components/ui/tooltip'
import { toast } from '@/components/ui/toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAppStore, useCurrentUser } from '@/store/app-store'
import { OPERATIONS, getStatusMeta } from '@/design/statuses'
import { buildTimeline, ACTION_META, type TimelineView } from '@/lib/timeline'
import { formatDate, formatDateLong, formatDateTime, formatFileSize, pluralWithCount } from '@/lib/format'
import { PassDocument } from '@/components/pass-document'

/**
 * КАРТОЧКА ЗАЯВКИ — общая структура, переиспользуемая для всех процессов.
 *
 * Шапка с номером и статусом, три вкладки: данные, таймлайн, вложения.
 * Действия согласующих зависят от роли и текущего статуса; заявитель
 * видит комментарий возврата и переход к исправлению.
 */
export default function ApplicationDetailPage() {
  return (
    <Suspense fallback={null}>
      <ApplicationDetail />
    </Suspense>
  )
}

function ApplicationDetail() {
  const router = useRouter()
  const searchParams = useSearchParams()
  /* Идентификатор приходит запросом, а не сегментом пути: прототип
     собирается статически и разворачивается на GitHub Pages, где
     серверного рендеринга динамических маршрутов нет. */
  const id = searchParams.get('id')
  const justSubmitted = searchParams.get('submitted') === '1'

  const user = useCurrentUser()
  const activeRole = useAppStore((s) => s.activeRole)
  const application = useAppStore((s) => s.applications.find((a) => a.id === id))
  const objects = useAppStore((s) => s.objects)

  const submitApplication = useAppStore((s) => s.submitApplication)
  const approveByObjectAdmin = useAppStore((s) => s.approveByObjectAdmin)
  const returnForRevision = useAppStore((s) => s.returnForRevision)
  const rejectApplication = useAppStore((s) => s.rejectApplication)
  const registerByGoc = useAppStore((s) => s.registerByGoc)
  const cancelApplication = useAppStore((s) => s.cancelApplication)

  const [dialog, setDialog] = useState<null | 'return' | 'reject' | 'cancel'>(null)
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState('')
  const [showDocument, setShowDocument] = useState(false)

  if (!application || !user || !activeRole) {
    return (
      <PageBody>
        <Card className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <Icon name="alert-circle" size={20} className="text-content-faint" />
          <p className="text-md font-medium text-content">Заявка не найдена</p>
          <Button variant="secondary" size="md" className="mt-1" asChild>
            <Link href="/applications">К списку заявок</Link>
          </Button>
        </Card>
      </PageBody>
    )
  }

  const object = objects.find((o) => o.id === application.objectId)
  const isOwner = application.applicantId === user.id
  const passport = application.attachments.find((f) => f.kind === 'passport')
  const supporting = application.attachments.filter((f) => f.kind === 'supporting')
  const photos = application.items.flatMap((item) =>
    item.photos.map((photo) => ({ photo, itemName: item.name })),
  )
  const attachmentCount = application.attachments.length + photos.length

  const timeline = buildTimeline(application)
  const isSynthetic = timeline.some((e) => e.synthetic)

  /* PDF доступен только после регистрации в ГОЦ */
  const pdfAvailable = application.status === 'registered' || application.status === 'expired'

  /* Какие действия доступны роли в текущем статусе */
  const canObjectAdminDecide =
    (activeRole === 'object_admin' || activeRole === 'super_admin') &&
    application.status === 'pending_object_admin' &&
    (activeRole === 'super_admin' || user.objectIds.includes(application.objectId))

  const canGocRegister =
    (activeRole === 'goc_officer' || activeRole === 'super_admin') &&
    (application.status === 'pending_goc' || application.status === 'approved')

  const canGocCancel =
    (activeRole === 'goc_officer' || activeRole === 'super_admin') &&
    application.status === 'registered'

  const canOwnerSubmit =
    isOwner && (application.status === 'draft' || application.status === 'returned')

  const confirmationDone = application.isNonResident
    ? Boolean(passport)
    : Boolean(application.edsSignature)

  function runWithComment(action: 'return' | 'reject' | 'cancel') {
    if (!comment.trim()) {
      setCommentError('Комментарий обязателен')
      return
    }
    if (action === 'return') {
      returnForRevision(application!.id, comment)
      toast.warning('Заявка возвращена на доработку')
    }
    if (action === 'reject') {
      rejectApplication(application!.id, comment)
      toast.danger('Заявка отклонена')
    }
    if (action === 'cancel') {
      cancelApplication(application!.id, comment)
      toast.danger('Пропуск аннулирован')
    }
    setDialog(null)
    setComment('')
    setCommentError('')
  }

  const statusMeta = getStatusMeta(application.status)

  return (
    <>
      <PageHeader
        icon="file-text"
        title={application.registrationNumber ?? application.applicationNumber}
        subtitle={
          <span className="flex flex-wrap items-center gap-1.5">
            <Badge tone="outline" size="sm" icon="package">
              Материальный пропуск
            </Badge>
            <span className="text-content-faint">·</span>
            <span>{statusMeta.description}</span>
          </span>
        }
        actions={
          <>
            <StatusBadge status={application.status} size="lg" />
            <Button variant="ghost" size="md" iconLeft="arrow-left" asChild>
              <Link href="/applications">К списку</Link>
            </Button>
            {pdfAvailable ? (
              <Button
                variant="secondary"
                size="md"
                iconLeft="download"
                onClick={() => {
                  setShowDocument(true)
                  toast.success('PDF сформирован (демо)', 'Документ открыт для просмотра и печати')
                }}
              >
                Скачать PDF
              </Button>
            ) : (
              <Tooltip content="Доступно после регистрации в ГОЦ">
                <Button variant="secondary" size="md" iconLeft="download" disabled>
                  Скачать PDF
                </Button>
              </Tooltip>
            )}
          </>
        }
      />

      <PageBody className="space-y-4">
        {justSubmitted ? (
          <div className="flex items-start gap-2 rounded-md border border-status-confirmed-border bg-status-confirmed-soft px-3 py-2.5">
            <Icon
              name="check-circle"
              size={15}
              className="mt-0.5 shrink-0 text-status-confirmed-base"
            />
            <p className="text-base text-status-confirmed-text">
              Заявка отправлена администратору объекта. Уведомление направлено согласующему.
            </p>
          </div>
        ) : null}

        {/* Возврат на доработку — заявителю нужен явный путь к исправлению */}
        {application.status === 'returned' ? (
          <div className="overflow-hidden rounded-md border border-status-unpaid-border bg-status-unpaid-soft">
            <div className="flex flex-wrap items-start justify-between gap-3 px-3.5 py-3">
              <div className="flex min-w-0 items-start gap-2.5">
                <Icon name="refresh" size={16} className="mt-0.5 shrink-0 text-status-unpaid-base" />
                <div className="min-w-0">
                  <p className="text-2xs font-semibold uppercase tracking-label text-status-unpaid-text">
                    Возвращена на доработку
                    {application.objectAdminName ? ` · ${application.objectAdminName}` : ''}
                  </p>
                  <p className="mt-1 text-base leading-relaxed text-status-unpaid-text">
                    {application.decisionComment ?? 'Комментарий не указан'}
                  </p>
                </div>
              </div>
              {isOwner ? (
                <Button
                  variant="primary"
                  size="md"
                  iconLeft="pencil"
                  onClick={() => router.push(`/applications/new?from=${application.id}`)}
                >
                  Исправить и отправить снова
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Отклонение и аннулирование */}
        {application.decisionComment &&
        (application.status === 'rejected' || application.status === 'cancelled') ? (
          <div className="flex items-start gap-2 rounded-md border border-status-conflict-border bg-status-conflict-soft px-3 py-2.5">
            <Icon
              name="alert-circle"
              size={15}
              className="mt-0.5 shrink-0 text-status-conflict-base"
            />
            <div>
              <p className="text-2xs font-semibold uppercase tracking-label text-status-conflict-text">
                {application.status === 'rejected' ? 'Отклонена' : 'Аннулирована'}
              </p>
              <p className="mt-0.5 text-base text-status-conflict-text">
                {application.decisionComment}
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* ─────────── Вкладки ─────────── */}
          <Tabs defaultValue="data">
            <TabsList>
              <TabsTrigger value="data">
                <Icon name="file-text" size={13} />
                Данные заявки
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <Icon name="activity" size={13} />
                Таймлайн
                <Counter value={timeline.length} />
              </TabsTrigger>
              <TabsTrigger value="files">
                <Icon name="paperclip" size={13} />
                Вложения
                {attachmentCount ? <Counter value={attachmentCount} /> : null}
              </TabsTrigger>
            </TabsList>

            {/* ── Данные заявки ── */}
            <TabsContent value="data" className="mt-4 space-y-4">
              <Card status={application.status}>
                <div className="border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
                  <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
                    Реквизиты пропуска
                  </h2>
                </div>
                <div className="px-4 py-3.5">
                  <MetaGrid columns={3}>
                    <MetaItem label="Номер заявки" value={application.applicationNumber} mono />
                    <MetaItem
                      label="Регистрационный номер"
                      value={application.registrationNumber ?? 'Не присвоен'}
                      mono
                      tone={application.registrationNumber ? 'accent' : 'muted'}
                    />
                    <MetaItem
                      label="Дата действия"
                      value={formatDateLong(application.validDate)}
                      icon="calendar"
                      tone="strong"
                    />
                    <MetaItem label="Операция" value={OPERATIONS[application.operation].label} />
                    <MetaItem label="Объект / блок" value={object?.nameRu} icon="building" />
                    <MetaItem
                      label="Позиций ТМЦ"
                      value={application.items.length}
                      icon="package"
                    />
                    <MetaItem label="Заявитель" value={application.applicantName} icon="user" />
                    <MetaItem label="Организация" value={application.organization} />
                    <MetaItem label="Место работы" value={application.workplace} />
                  </MetaGrid>

                  <div className="mt-3.5 border-t border-hairline-soft pt-3">
                    <p className="text-2xs font-semibold uppercase tracking-label text-content-faint">
                      Основание
                    </p>
                    <p className="mt-1 whitespace-pre-line text-base leading-relaxed text-content">
                      {application.basis}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Перечень ТМЦ */}
              <Card>
                <div className="border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
                  <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
                    Товарно-материальные ценности
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-surface-sunken">
                      <tr>
                        {['№', 'Наименование', 'Кол-во', 'Ед.', 'Модель / описание', 'Серийный №'].map(
                          (h) => (
                            <th
                              key={h}
                              className="h-row whitespace-nowrap border-b border-hairline px-3 text-2xs font-semibold uppercase tracking-label text-content-faint"
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {application.items.map((item, index) => (
                        <tr key={item.id} className="border-b border-hairline-soft last:border-0">
                          <td className="h-row-lg px-3 text-base tabular-nums text-content-faint">
                            {index + 1}
                          </td>
                          <td className="h-row-lg px-3 text-base font-medium text-content">
                            {item.name}
                          </td>
                          <td className="h-row-lg px-3 text-base tabular-nums text-content">
                            {item.quantity}
                          </td>
                          <td className="h-row-lg px-3 text-base text-content-muted">{item.unit}</td>
                          <td className="h-row-lg px-3 text-base text-content-muted">
                            {item.model || '—'}
                          </td>
                          <td className="h-row-lg px-3 font-mono text-sm text-content-muted">
                            {item.serialNumber || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* ── Таймлайн ── */}
            <TabsContent value="timeline" className="mt-4">
              <Card>
                <div className="flex items-center justify-between gap-2 border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
                  <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
                    История прохождения заявки
                  </h2>
                  <span className="text-2xs tabular-nums text-content-faint">
                    {pluralWithCount(timeline.length, ['событие', 'события', 'событий'])}
                  </span>
                </div>

                {isSynthetic ? (
                  <p className="flex items-start gap-1.5 border-b border-hairline-soft bg-surface-sunken px-4 py-2 text-xs text-content-faint">
                    <Icon name="info" size={12} className="mt-0.5 shrink-0" />
                    История восстановлена по текущему статусу и отметкам времени: подробный журнал
                    для этой заявки не сохранялся.
                  </p>
                ) : null}

                <ol className="px-4 py-3.5">
                  {timeline.map((entry, index) => (
                    <TimelineRow
                      key={entry.id}
                      entry={entry}
                      last={index === timeline.length - 1}
                      current={index === timeline.length - 1}
                    />
                  ))}
                </ol>
              </Card>
            </TabsContent>

            {/* ── Вложения ── */}
            <TabsContent value="files" className="mt-4 space-y-4">
              {attachmentCount === 0 ? (
                <Card className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md border border-hairline bg-surface-sunken text-content-faint">
                    <Icon name="paperclip" size={18} />
                  </span>
                  <p className="text-md font-medium text-content">Вложений нет</p>
                  <p className="max-w-sm text-base text-content-faint">
                    К этой заявке не приложены подтверждающие документы и фотографии ТМЦ.
                  </p>
                </Card>
              ) : (
                <>
                  {/* Паспорт нерезидента — защищённое хранилище */}
                  {passport ? (
                    <Card className="border-signal-200">
                      <div className="flex items-center gap-2 border-b border-signal-200 bg-signal-50 px-4 py-2.5">
                        <Icon name="lock" size={14} className="text-signal-700" />
                        <h2 className="text-2xs font-semibold uppercase tracking-label text-signal-800">
                          Документ, удостоверяющий личность
                        </h2>
                      </div>
                      <div className="px-4 py-3">
                        <FileRow
                          name={passport.fileName}
                          size={passport.size}
                          at={passport.uploadedAt}
                          icon="id-card"
                          protectedFile
                          preview={passport.dataUrl}
                        />
                        <p className="mt-2 flex items-start gap-1.5 text-xs text-content-faint">
                          <Icon name="lock" size={12} className="mt-0.5 shrink-0" />
                          Хранится в защищённом файловом хранилище, не публикуется на странице
                          QR-проверки; просмотр и скачивание журналируются.
                        </p>
                      </div>
                    </Card>
                  ) : null}

                  {/* Подтверждающие документы */}
                  {supporting.length ? (
                    <Card>
                      <div className="border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
                        <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
                          Подтверждающие документы
                        </h2>
                      </div>
                      <ul className="divide-y divide-hairline-soft px-4">
                        {supporting.map((file) => (
                          <li key={file.id} className="py-2.5">
                            <FileRow
                              name={file.fileName}
                              size={file.size}
                              at={file.uploadedAt}
                              icon="file-text"
                            />
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ) : null}

                  {/* Фотографии позиций ТМЦ */}
                  {photos.length ? (
                    <Card>
                      <div className="border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
                        <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
                          Фотографии ТМЦ
                        </h2>
                      </div>
                      <ul className="grid gap-2 px-4 py-3 sm:grid-cols-2">
                        {photos.map(({ photo, itemName }) => (
                          <li
                            key={photo.id}
                            className="flex items-center gap-2.5 rounded border border-hairline bg-surface-sunken px-2.5 py-2"
                          >
                            {photo.dataUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={photo.dataUrl}
                                alt={photo.name}
                                className="h-11 w-11 shrink-0 rounded border border-hairline object-cover"
                              />
                            ) : (
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-hairline bg-surface text-content-faint">
                                <Icon name="eye" size={15} />
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-base text-content">{photo.name}</p>
                              <p className="truncate text-2xs text-content-faint">{itemName}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ) : null}
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* ─────────── Боковая колонка ─────────── */}
          <div className="space-y-3">
            {canObjectAdminDecide || canGocRegister || canGocCancel || canOwnerSubmit ? (
              <Card className="border-accent-line">
                <div className="border-b border-accent-line bg-accent-soft px-4 py-2.5">
                  <h2 className="text-2xs font-semibold uppercase tracking-label text-accent-strong">
                    Требуется ваше действие
                  </h2>
                </div>
                <div className="space-y-2 px-4 py-3.5">
                  {canOwnerSubmit ? (
                    <>
                      {!confirmationDone ? (
                        <p className="mb-1 flex items-start gap-1.5 rounded border border-status-review-border bg-status-review-soft px-2.5 py-2 text-xs text-status-review-text">
                          <Icon name="alert-circle" size={12} className="mt-0.5 shrink-0" />
                          {application.isNonResident
                            ? 'Приложите копию паспорта — без документа отправка заблокирована.'
                            : 'Подпишите заявку ЭЦП — без подписи отправка заблокирована.'}
                        </p>
                      ) : null}
                      <Button
                        variant="primary"
                        size="md"
                        iconLeft="check"
                        block
                        disabled={!confirmationDone}
                        onClick={() => {
                          submitApplication(application.id)
                          toast.success('Заявка отправлена на согласование')
                        }}
                      >
                        Отправить на согласование
                      </Button>
                    </>
                  ) : null}

                  {canObjectAdminDecide ? (
                    <>
                      <Button
                        variant="primary"
                        size="md"
                        iconLeft="check"
                        block
                        onClick={() => {
                          approveByObjectAdmin(application.id)
                          toast.success('Заявка согласована', 'Передана в Главный оперативный центр')
                        }}
                      >
                        Согласовать
                      </Button>
                      <Button
                        variant="secondary"
                        size="md"
                        iconLeft="refresh"
                        block
                        onClick={() => setDialog('return')}
                      >
                        Вернуть на доработку
                      </Button>
                      <Button
                        variant="danger"
                        size="md"
                        iconLeft="x-circle"
                        block
                        onClick={() => setDialog('reject')}
                      >
                        Отклонить
                      </Button>
                    </>
                  ) : null}

                  {canGocRegister ? (
                    <>
                      <Button
                        variant="primary"
                        size="md"
                        iconLeft="stamp"
                        block
                        onClick={() => {
                          registerByGoc(application.id)
                          toast.success('Пропуск зарегистрирован', 'PDF с QR-кодом сформирован')
                        }}
                      >
                        Зарегистрировать пропуск
                      </Button>
                      <p className="flex items-start gap-1.5 text-xs text-content-faint">
                        <Icon name="info" size={12} className="mt-0.5 shrink-0" />
                        Будет присвоен уникальный номер, сформирован PDF с QR-кодом и отправлено
                        письмо заявителю.
                      </p>
                    </>
                  ) : null}

                  {canGocCancel ? (
                    <Button
                      variant="danger"
                      size="md"
                      iconLeft="ban"
                      block
                      onClick={() => setDialog('cancel')}
                    >
                      Аннулировать пропуск
                    </Button>
                  ) : null}
                </div>
              </Card>
            ) : null}

            {/* Подтверждение заявителя */}
            <Card>
              <div className="border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
                <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
                  Подтверждение заявителя
                </h2>
              </div>
              <div className="px-4 py-3.5">
                {application.isNonResident ? (
                  <>
                    <Badge tone="signal" size="md" icon="id-card">
                      Нерезидент РК — паспорт
                    </Badge>
                    <p className="mt-2 text-base text-content-muted">
                      {passport ? 'Документ приложен' : 'Паспорт не приложен'}
                    </p>
                    <p className="mt-1 text-xs text-content-faint">
                      ЭЦП Республики Казахстан для нерезидента не требуется.
                    </p>
                  </>
                ) : (
                  <>
                    <Badge tone="navy" size="md" icon="pen">
                      Резидент РК — ЭЦП
                    </Badge>
                    {application.edsSignature ? (
                      <dl className="mt-2.5 space-y-1.5">
                        <SideRow
                          label="Подписано"
                          value={formatDateTime(application.edsSignature.signedAt)}
                        />
                        <SideRow
                          label="Владелец сертификата"
                          value={application.edsSignature.certificateSubject}
                        />
                        <SideRow
                          label="Серийный номер"
                          value={application.edsSignature.certificateSerial}
                          mono
                        />
                      </dl>
                    ) : (
                      <p className="mt-2 text-base text-status-conflict-text">
                        Заявка не подписана ЭЦП
                      </p>
                    )}
                  </>
                )}
              </div>
            </Card>

            {/* Маршрут */}
            <Card>
              <div className="border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
                <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
                  Маршрут
                </h2>
              </div>
              <div className="space-y-2.5 px-4 py-3.5">
                <RouteStep
                  index={1}
                  title="Заявитель"
                  name={application.applicantName}
                  done
                  at={application.createdAt}
                />
                <RouteStep
                  index={2}
                  title="Администратор объекта"
                  name={application.objectAdminName ?? 'Не назначен'}
                  done={Boolean(application.approvedAt)}
                  at={application.approvedAt}
                  active={application.status === 'pending_object_admin'}
                />
                <RouteStep
                  index={3}
                  title="Главный оперативный центр"
                  name={application.gocOfficerName ?? 'Ожидает'}
                  done={Boolean(application.registeredAt)}
                  at={application.registeredAt}
                  active={application.status === 'pending_goc' || application.status === 'approved'}
                  last
                />
              </div>
            </Card>
          </div>
        </div>
      </PageBody>

      {/* Решение с обязательным комментарием */}
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null)
            setComment('')
            setCommentError('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === 'return'
                ? 'Вернуть заявку на доработку'
                : dialog === 'reject'
                  ? 'Отклонить заявку'
                  : 'Аннулировать пропуск'}
            </DialogTitle>
            <DialogDescription>
              {dialog === 'return'
                ? 'Заявитель получит уведомление и сможет исправить данные'
                : dialog === 'reject'
                  ? 'Процесс завершится отказом с зафиксированной причиной'
                  : 'Документ будет отменён, запись останется в реестре'}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field
              label={dialog === 'return' ? 'Комментарий' : 'Причина'}
              required
              error={commentError}
              hint="Комментарий обязателен и будет зафиксирован в истории заявки"
              htmlFor="decision-comment"
            >
              <Textarea
                id="decision-comment"
                rows={4}
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value)
                  if (e.target.value.trim()) setCommentError('')
                }}
                invalid={Boolean(commentError)}
                placeholder={
                  dialog === 'return'
                    ? 'Например: уточните основание, добавьте номер договора'
                    : 'Например: состав ТМЦ не соответствует основанию'
                }
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" size="md" onClick={() => setDialog(null)}>
              Отмена
            </Button>
            <Button
              variant={dialog === 'return' ? 'primary' : 'danger'}
              size="md"
              onClick={() => dialog && runWithComment(dialog)}
            >
              {dialog === 'return' ? 'Вернуть' : dialog === 'reject' ? 'Отклонить' : 'Аннулировать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Итоговый документ */}
      <Dialog open={showDocument} onOpenChange={setShowDocument}>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>Материальный пропуск</DialogTitle>
            <DialogDescription>
              Итоговый документ, направляемый заявителю по электронной почте
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="bg-surface-sunken">
            <PassDocument application={application} objectName={object?.nameRu ?? '—'} />
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" size="md" onClick={() => setShowDocument(false)}>
              Закрыть
            </Button>
            <Button variant="secondary" size="md" iconLeft="download" onClick={() => window.print()}>
              Печать / сохранить PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ─────────────── Блоки карточки ─────────────── */

function TimelineRow({
  entry,
  last,
  current,
}: {
  entry: TimelineView
  last: boolean
  current: boolean
}) {
  const meta = ACTION_META[entry.action]

  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!last ? (
        <span aria-hidden="true" className="absolute left-[11px] top-6 h-full w-px bg-hairline" />
      ) : null}
      <span
        className={cn(
          'relative z-base flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border',
          current
            ? 'border-accent bg-accent text-content-inverse shadow-beam-sm'
            : 'border-hairline bg-surface text-content-faint',
        )}
      >
        <Icon name={meta.icon} size={11} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p
            className={cn(
              'text-base',
              current ? 'font-semibold text-content' : 'font-medium text-content',
            )}
          >
            {meta.label}
          </p>
          <span className="shrink-0 text-xs tabular-nums text-content-faint">
            {formatDateTime(entry.at)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-content-subtle">{entry.actorName}</p>
        {entry.comment ? (
          <p className="mt-1.5 rounded border border-hairline bg-surface-sunken px-2.5 py-1.5 text-base text-content-muted">
            {entry.comment}
          </p>
        ) : null}
      </div>
    </li>
  )
}

function FileRow({
  name,
  size,
  at,
  icon,
  protectedFile = false,
  preview,
}: {
  name: string
  size: number
  at: string
  icon: string
  protectedFile?: boolean
  /** Миниатюра изображения; у PDF её нет */
  preview?: string
}) {
  const [zoom, setZoom] = useState(false)

  return (
    <div className="flex items-center gap-2.5">
      {preview ? (
        <button
          type="button"
          onClick={() => setZoom(true)}
          aria-label={`Открыть ${name}`}
          className="focus-ring h-12 w-9 shrink-0 overflow-hidden rounded border border-signal-200 bg-surface"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="h-full w-full object-cover" />
        </button>
      ) : (
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded border',
            protectedFile
              ? 'border-signal-200 bg-signal-50 text-signal-700'
              : 'border-hairline bg-surface-sunken text-content-faint',
          )}
        >
          <Icon name={icon} size={15} />
        </span>
      )}

      {/* Просмотр документа в полный размер */}
      {zoom && preview ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={name}
          className="fixed inset-0 z-modal flex items-center justify-center bg-overlay p-6"
          onClick={() => setZoom(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="max-h-full max-w-full rounded-md border border-hairline shadow-xl"
          />
          <button
            type="button"
            onClick={() => setZoom(false)}
            aria-label="Закрыть просмотр"
            className="focus-ring absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-surface text-content"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium text-content">{name}</p>
        <p className="truncate text-2xs tabular-nums text-content-faint">
          {formatFileSize(size)} · загружен {formatDate(at)}
        </p>
      </div>
      <Tooltip content="Скачивание доступно в промышленной версии">
        <Button variant="ghost" size="icon-sm" aria-label={`Скачать ${name}`} disabled>
          <Icon name="download" size={14} />
        </Button>
      </Tooltip>
    </div>
  )
}

function RouteStep({
  index,
  title,
  name,
  done,
  active,
  at,
  last,
}: {
  index: number
  title: string
  name: string
  done?: boolean
  active?: boolean
  at?: string
  last?: boolean
}) {
  return (
    <div className="relative flex gap-2.5">
      {!last ? (
        <span
          aria-hidden="true"
          className="absolute left-[11px] top-6 h-[calc(100%-4px)] w-px bg-hairline"
        />
      ) : null}
      <span
        className={cn(
          'relative z-base flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-2xs font-semibold tabular-nums',
          done
            ? 'border-status-confirmed-border bg-status-confirmed-soft text-status-confirmed-text'
            : active
              ? 'border-accent bg-accent text-content-inverse shadow-beam-sm'
              : 'border-hairline bg-surface text-content-faint',
        )}
      >
        {done ? <Icon name="check" size={11} strokeWidth={2.4} /> : index}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-2xs font-semibold uppercase tracking-label text-content-faint">{title}</p>
        <p
          className={cn(
            'truncate text-base',
            active ? 'font-medium text-content' : 'text-content-muted',
          )}
        >
          {name}
        </p>
        {at ? <p className="text-2xs tabular-nums text-content-faint">{formatDateTime(at)}</p> : null}
      </div>
    </div>
  )
}

function SideRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-2xs font-semibold uppercase tracking-label text-content-faint">{label}</dt>
      <dd className={cn('truncate text-xs text-content-muted', mono && 'font-mono')}>{value}</dd>
    </div>
  )
}
