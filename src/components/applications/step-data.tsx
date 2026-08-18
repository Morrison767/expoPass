'use client'

import { Controller, useFormContext } from 'react-hook-form'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { Card } from '@/components/ui/card'
import { Input, Textarea, Field } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import { Icon } from '@/components/ui/icon'
import { OPERATIONS } from '@/design/statuses'
import { todayIso } from '@/store/app-store'
import type { ApplicationFormValues } from '@/lib/application-schema'
import type { SiteObject, User } from '@/lib/types'
import type { Operation } from '@/lib/types'

/**
 * ШАГ 1 — ДАННЫЕ ЗАЯВКИ (п. 8.2 ТЗ).
 *
 * Заявитель и организация подставляются из подтверждённого профиля и
 * не редактируются: подмена заявителя в заявке запрещена.
 * Операция вынесена в два крупных взаимоисключающих переключателя —
 * это ключевое бизнес-правило, и оно должно читаться с первого взгляда.
 */
export function StepData({ user, objects }: { user: User; objects: SiteObject[] }) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ApplicationFormValues>()

  const activeObjects = objects.filter((o) => o.isActive)
  const organization = user.organization ?? 'АО «НК «QazExpoCongress»'

  return (
    <div className="space-y-4">
      {/* Заявитель — только для чтения */}
      <Card>
        <div className="border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
          <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
            Заявитель
          </h2>
        </div>
        <div className="grid gap-3 px-4 py-3.5 sm:grid-cols-2">
          <Field label="Ф.И.О. заявителя" labelSuffix={<AutoFilled />}>
            <Input
              value={[user.lastName, user.firstName, user.middleName].filter(Boolean).join(' ')}
              readOnly
              iconLeft="user"
            />
          </Field>
          <Field label="Организация" labelSuffix={<AutoFilled />}>
            <Input value={organization} readOnly iconLeft="building" />
          </Field>
          <Field label="Адрес электронной почты" labelSuffix={<AutoFilled />}>
            <Input value={user.email} readOnly iconLeft="mail" />
          </Field>
          <Field
            label="Место работы / кабинет"
            hint="Можно уточнить для этой заявки"
            htmlFor="workplace"
          >
            <Input
              id="workplace"
              {...register('workplace')}
              placeholder="Например: Конгресс-центр, каб. 312"
            />
          </Field>
        </div>
        <p className="flex items-start gap-1.5 border-t border-hairline-soft px-4 py-2.5 text-xs text-content-faint">
          <Icon name="lock" size={12} className="mt-0.5 shrink-0" />
          Сведения взяты из подтверждённого профиля. Подмена заявителя в заявке запрещена.
        </p>
      </Card>

      {/* Операция — крупный взаимоисключающий выбор */}
      <Card className={errors.operation ? 'border-status-conflict-border' : undefined}>
        <div className="border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
          <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
            Операция <span className="text-danger-500">*</span>
          </h2>
        </div>
        <div className="px-4 py-3.5">
          <Controller
            control={control}
            name="operation"
            render={({ field }) => (
              <div className="grid gap-3 sm:grid-cols-2">
                {(['in', 'out'] as Operation[]).map((key) => {
                  const active = field.value === key
                  const meta = OPERATIONS[key]

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => field.onChange(key)}
                      aria-pressed={active}
                      className={cn(
                        'focus-ring group relative overflow-hidden rounded-md border p-4 text-left transition-all duration-base ease-decelerate',
                        active
                          ? 'border-accent bg-accent-soft shadow-beam'
                          : 'border-hairline-strong bg-surface-raised hover:-translate-y-px hover:border-content-faint hover:shadow-card-hover',
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="operation-rail"
                          aria-hidden="true"
                          className="absolute inset-y-0 left-0 w-rail bg-accent shadow-beam-sm"
                        />
                      ) : null}

                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'flex h-12 w-12 shrink-0 items-center justify-center rounded-md border transition-colors duration-fast',
                            active
                              ? 'border-accent-line bg-surface text-accent-fg'
                              : 'border-hairline bg-surface-sunken text-content-faint',
                          )}
                        >
                          <Icon name={meta.icon} size={24} strokeWidth={1.9} />
                        </span>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              'text-2xl font-bold uppercase leading-none tracking-plate',
                              active ? 'text-accent-strong' : 'text-content',
                            )}
                          >
                            {meta.label}
                          </p>
                          <p className="mt-1.5 text-xs leading-snug text-content-subtle">
                            {meta.description}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-fast',
                            active
                              ? 'border-accent bg-accent text-content-inverse'
                              : 'border-hairline-strong bg-surface',
                          )}
                        >
                          {active ? <Icon name="check" size={12} strokeWidth={2.6} /> : null}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          />

          <p className="mt-2.5 flex items-start gap-1.5 text-xs text-content-faint">
            <Icon name="info" size={12} className="mt-0.5 shrink-0" />
            Одна заявка оформляется строго на одну операцию. Если нужны и внос, и вынос —
            оформите две отдельные заявки.
          </p>

          {errors.operation ? (
            <p className="mt-2 flex items-start gap-1 text-xs text-status-conflict-text">
              <Icon name="alert-circle" size={12} className="mt-px" />
              {errors.operation.message}
            </p>
          ) : null}
        </div>
      </Card>

      {/* Объект, дата, основание */}
      <Card>
        <div className="border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
          <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
            Объект, дата и основание
          </h2>
        </div>
        <div className="space-y-4 px-4 py-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Объект / павильон / блок"
              required
              error={errors.objectId?.message}
              hint="Доступны только активные объекты справочника"
              htmlFor="objectId"
            >
              <Controller
                control={control}
                name="objectId"
                render={({ field }) => (
                  <Combobox
                    id="objectId"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={Boolean(errors.objectId)}
                    placeholder="Выберите объект"
                    searchPlaceholder="Начните вводить название…"
                    options={activeObjects.map((o) => ({ value: o.id, label: o.nameRu }))}
                  />
                )}
              />
            </Field>

            <Field
              label="Дата вноса / выноса"
              required
              error={errors.validDate?.message}
              hint="Только один день — диапазон «с/по» не предусмотрен"
              htmlFor="validDate"
            >
              <Input
                id="validDate"
                type="date"
                min={todayIso()}
                {...register('validDate')}
                invalid={Boolean(errors.validDate)}
              />
            </Field>
          </div>

          <Field
            label="Основание"
            required
            error={errors.basis?.message}
            hint="Договор, письмо, заявка, мероприятие, монтаж или демонтаж, производственная необходимость"
            htmlFor="basis"
          >
            <Textarea
              id="basis"
              rows={4}
              {...register('basis')}
              invalid={Boolean(errors.basis)}
              placeholder="напр.: договор аренды № 114-П/2026 от 03.06.2026, письмо от 12.08.2026 № 07-14/338, монтаж выставочного стенда к форуму Digital Almaty"
            />
          </Field>
        </div>
      </Card>
    </div>
  )
}

/** Пометка «подставлено из профиля» — рядом с полями только для чтения */
function AutoFilled() {
  return (
    <span className="inline-flex items-center gap-1 text-2xs font-normal text-content-faint">
      <Icon name="check-circle" size={11} className="text-accent-fg" />
      автоматически из профиля
    </span>
  )
}
