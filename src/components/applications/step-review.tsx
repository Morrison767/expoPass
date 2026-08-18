'use client'

import { useFormContext } from 'react-hook-form'
import { cn } from '@/lib/cn'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { OPERATIONS } from '@/design/statuses'
import { formatDateLong, formatDateTime, formatFileSize, pluralWithCount } from '@/lib/format'
import type { ApplicationFormValues } from '@/lib/application-schema'
import type { SiteObject, User } from '@/lib/types'

/**
 * ШАГ 4 — ПРОВЕРКА (п. 16 ТЗ).
 *
 * Перед окончательной отправкой показывается сводка всего введённого.
 * У каждого блока — переход на соответствующий шаг: исправлять данные
 * должно быть проще, чем возвращаться назад вслепую.
 */
export function StepReview({
  user,
  objects,
  onEditStep,
}: {
  user: User
  objects: SiteObject[]
  onEditStep: (step: 'data' | 'items' | 'identity') => void
}) {
  const { watch } = useFormContext<ApplicationFormValues>()
  const values = watch()

  const object = objects.find((o) => o.id === values.objectId)
  const passport = values.attachments.find((f) => f.kind === 'passport')
  const totalPhotos = values.items.reduce((sum, item) => sum + item.photos.length, 0)

  return (
    <div className="space-y-4">
      {/* Блок 1 — данные заявки */}
      <Card>
        <SectionHead title="Данные заявки" onEdit={() => onEditStep('data')} />
        <div className="px-4 py-3.5">
          {/* Операция крупно — главный реквизит на КПП */}
          <div className="mb-3.5 flex flex-wrap items-center gap-3 rounded-md border border-accent-line bg-accent-soft px-3.5 py-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-accent-line bg-surface text-accent-fg">
              <Icon name={OPERATIONS[values.operation].icon} size={22} strokeWidth={1.9} />
            </span>
            <div>
              <p className="text-2xs font-semibold uppercase tracking-label text-accent-strong">
                Операция
              </p>
              <p className="text-2xl font-bold uppercase leading-none tracking-plate text-accent-strong">
                {OPERATIONS[values.operation].label}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xs font-semibold uppercase tracking-label text-accent-strong">
                Дата действия
              </p>
              <p className="text-md font-semibold tabular-nums text-content">
                {formatDateLong(values.validDate)}
              </p>
            </div>
          </div>

          <dl className="grid gap-x-5 gap-y-3 sm:grid-cols-3">
            <ReviewRow
              label="Заявитель"
              value={[user.lastName, user.firstName, user.middleName].filter(Boolean).join(' ')}
            />
            <ReviewRow
              label="Организация"
              value={user.organization ?? 'АО «НК «QazExpoCongress»'}
            />
            <ReviewRow label="Объект / блок" value={object?.nameRu ?? '—'} />
            <ReviewRow label="Место работы" value={values.workplace || '—'} />
            <ReviewRow label="Электронная почта" value={user.email} className="sm:col-span-2" />
            <div className="min-w-0 sm:col-span-3">
              <dt className="text-2xs font-semibold uppercase tracking-label text-content-faint">
                Основание
              </dt>
              <dd className="mt-0.5 whitespace-pre-line text-base leading-relaxed text-content">
                {values.basis}
              </dd>
            </div>
          </dl>
        </div>
      </Card>

      {/* Блок 2 — перечень ТМЦ */}
      <Card>
        <SectionHead
          title={`Товарно-материальные ценности · ${pluralWithCount(values.items.length, ['позиция', 'позиции', 'позиций'])}`}
          onEdit={() => onEditStep('items')}
        />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-sunken">
              <tr>
                {['№', 'Наименование', 'Кол-во', 'Ед.', 'Модель', 'Серийный №', 'Фото'].map((h) => (
                  <th
                    key={h}
                    className="h-row whitespace-nowrap border-b border-hairline px-3 text-2xs font-semibold uppercase tracking-label text-content-faint"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {values.items.map((item, index) => (
                <tr key={item.id} className="border-b border-hairline-soft last:border-0">
                  <td className="h-row-lg px-3 text-base tabular-nums text-content-faint">
                    {index + 1}
                  </td>
                  <td className="h-row-lg px-3 text-base font-medium text-content">{item.name}</td>
                  <td className="h-row-lg px-3 text-base tabular-nums text-content">
                    {item.quantity}
                  </td>
                  <td className="h-row-lg px-3 text-base text-content-muted">{item.unit}</td>
                  <td className="h-row-lg px-3 text-base text-content-muted">{item.model || '—'}</td>
                  <td className="h-row-lg px-3 font-mono text-sm text-content-muted">
                    {item.serialNumber || '—'}
                  </td>
                  <td className="h-row-lg px-3">
                    {item.photos.length ? (
                      <span className="flex items-center gap-1">
                        {item.photos.slice(0, 3).map((photo) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={photo.id}
                            src={photo.dataUrl}
                            alt=""
                            className="h-7 w-7 rounded border border-hairline object-cover"
                          />
                        ))}
                        {item.photos.length > 3 ? (
                          <span className="text-2xs text-content-faint">
                            +{item.photos.length - 3}
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-base text-content-faint">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPhotos ? (
          <p className="border-t border-hairline-soft bg-surface-sunken px-4 py-2 text-xs text-content-faint">
            Приложено фотографий: {totalPhotos}
          </p>
        ) : null}
      </Card>

      {/* Блок 3 — подтверждение личности */}
      <Card
        className={
          values.isNonResident
            ? passport
              ? 'border-status-confirmed-border'
              : undefined
            : values.edsSignature
              ? 'border-status-confirmed-border'
              : undefined
        }
      >
        <SectionHead title="Подтверждение личности" onEdit={() => onEditStep('identity')} />
        <div className="px-4 py-3.5">
          {values.isNonResident ? (
            <div className="flex flex-wrap items-start gap-3">
              {passport?.dataUrl ? (
                <div className="h-24 w-20 shrink-0 overflow-hidden rounded border border-hairline bg-surface-sunken">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={passport.dataUrl} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <span className="flex h-24 w-20 shrink-0 items-center justify-center rounded border border-hairline bg-surface-sunken text-content-faint">
                  <Icon name="file-text" size={22} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <Badge tone="signal" size="md" icon="id-card">
                  Нерезидент РК — паспорт
                </Badge>
                <p className="mt-2 flex items-center gap-1.5 text-md font-semibold text-status-confirmed-text">
                  <Icon name="check" size={15} strokeWidth={2.4} />
                  Документ приложен
                </p>
                <p className="mt-0.5 truncate font-mono text-xs text-content-muted">
                  {passport?.fileName}
                </p>
                {passport ? (
                  <p className="text-2xs tabular-nums text-content-faint">
                    {formatFileSize(passport.size)}
                  </p>
                ) : null}
                <p className="mt-1.5 text-xs text-content-faint">
                  ЭЦП Республики Казахстан не требуется.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <Badge tone="navy" size="md" icon="pen">
                Резидент РК — ЭЦП
              </Badge>
              {values.edsSignature ? (
                <>
                  <p className="mt-2 flex items-center gap-1.5 text-md font-semibold text-status-confirmed-text">
                    <Icon name="check" size={15} strokeWidth={2.4} />
                    Заявка подписана ЭЦП
                  </p>
                  <dl className="mt-2 grid gap-x-5 gap-y-2 sm:grid-cols-2">
                    <ReviewRow
                      label="Дата подписания"
                      value={formatDateTime(values.edsSignature.signedAt)}
                    />
                    <ReviewRow
                      label="Владелец сертификата"
                      value={values.edsSignature.certificateSubject}
                    />
                    <ReviewRow
                      label="Серийный номер"
                      value={values.edsSignature.certificateSerial}
                      mono
                    />
                    <ReviewRow
                      label="Хэш документа"
                      value={`${values.edsSignature.dataHash.slice(0, 24)}…`}
                      mono
                    />
                  </dl>
                </>
              ) : (
                <p className="mt-2 text-base text-status-conflict-text">Заявка не подписана</p>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function SectionHead({ title, onEdit }: { title: string; onEdit: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
      <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
        {title}
      </h2>
      <Button variant="ghost" size="sm" iconLeft="pencil" onClick={onEdit}>
        Изменить
      </Button>
    </div>
  )
}

function ReviewRow({
  label,
  value,
  mono,
  className,
}: {
  label: string
  value: string
  mono?: boolean
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="text-2xs font-semibold uppercase tracking-label text-content-faint">{label}</dt>
      <dd className={cn('mt-0.5 truncate text-base text-content', mono && 'font-mono text-xs')}>
        {value}
      </dd>
    </div>
  )
}
