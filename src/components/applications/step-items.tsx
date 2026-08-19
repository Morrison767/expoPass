'use client'

import { useState } from 'react'
import { Controller, useFieldArray, useFormContext } from 'react-hook-form'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { Card } from '@/components/ui/card'
import { Button, IconButton } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { Plate } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { FileDrop } from '@/components/ui/file-drop'
import { toast } from '@/components/ui/toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UNITS } from '@/lib/types'
import { fileToPhotoRef, isAcceptedImage, MAX_FILE_SIZE } from '@/lib/image'
import { formatFileSize, pluralWithCount } from '@/lib/format'
import { makeEmptyItem, type ApplicationFormValues } from '@/lib/application-schema'

/**
 * ШАГ 2 — ТАБЛИЦА ТМЦ (п. 8.3 ТЗ).
 *
 * Строки добавляются и удаляются без перезагрузки, каждая позиция хранится
 * структурированно. Минимум одна позиция обязательна, количество больше нуля.
 * Фотографии уменьшаются до миниатюр на клиенте — оригиналы в прототипе
 * никуда не отправляются.
 */
export function StepItems() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ApplicationFormValues>()

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const itemsError = errors.items?.message ?? errors.items?.root?.message

  return (
    <Card>
      {/* Шапка со счётчиком позиций */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
            Товарно-материальные ценности
          </h2>
          <span className="inline-flex items-center gap-1 rounded border border-accent-line bg-accent-soft px-2 py-0.5 text-2xs font-semibold text-accent-strong">
            <Icon name="package" size={11} />
            Позиций в заявке: {fields.length}
          </span>
        </div>
        <Button variant="secondary" size="sm" iconLeft="plus" onClick={() => append(makeEmptyItem())}>
          Добавить позицию
        </Button>
      </div>

      {itemsError ? (
        <p className="flex items-start gap-1.5 border-b border-status-conflict-border bg-status-conflict-soft px-4 py-2 text-xs text-status-conflict-text">
          <Icon name="alert-circle" size={12} className="mt-0.5 shrink-0" />
          {itemsError}
        </p>
      ) : null}

      {/* Строки таблицы */}
      <ul className="divide-y divide-hairline-soft">
        <AnimatePresence initial={false}>
          {fields.map((field, index) => (
            <motion.li
              key={field.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="px-4 py-3.5">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <Plate>Позиция {index + 1}</Plate>
                  <IconButton
                    icon="trash"
                    label={`Удалить позицию ${index + 1}`}
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field
                    label="Наименование"
                    required
                    error={errors.items?.[index]?.name?.message}
                    className="sm:col-span-2"
                  >
                    <Input
                      {...register(`items.${index}.name`)}
                      invalid={Boolean(errors.items?.[index]?.name)}
                      placeholder="Например: ноутбук Dell Latitude 5540"
                    />
                  </Field>

                  <Field
                    label="Количество"
                    required
                    error={errors.items?.[index]?.quantity?.message}
                  >
                    <Input
                      type="number"
                      min={1}
                      step="any"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      invalid={Boolean(errors.items?.[index]?.quantity)}
                    />
                  </Field>

                  <Field label="Единица измерения">
                    <Controller
                      control={control}
                      name={`items.${index}.unit`}
                      render={({ field: unitField }) => (
                        <Select value={unitField.value} onValueChange={unitField.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNITS.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>

                  <Field label="Модель / описание">
                    <Input {...register(`items.${index}.model`)} />
                  </Field>
                  <Field label="Серийный / инвентарный №" optional>
                    <Input mono {...register(`items.${index}.serialNumber`)} />
                  </Field>
                  <Field label="Отличительные признаки" optional>
                    <Input
                      {...register(`items.${index}.distinctiveFeatures`)}
                      placeholder="Наклейки, маркировка, повреждения"
                    />
                  </Field>
                  <Field label="Примечание" optional>
                    <Input {...register(`items.${index}.note`)} />
                  </Field>
                </div>

                {/* Фотографии позиции */}
                <Controller
                  control={control}
                  name={`items.${index}.photos`}
                  render={({ field: photoField }) => (
                    <PhotoUploader
                      photos={photoField.value}
                      onChange={photoField.onChange}
                      index={index}
                    />
                  )}
                />
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline-soft bg-surface-sunken px-4 py-2.5">
        <span className="text-xs text-content-faint">
          {pluralWithCount(fields.length, ['позиция', 'позиции', 'позиций'])} в заявке
        </span>
        <Button variant="secondary" size="sm" iconLeft="plus" onClick={() => append(makeEmptyItem())}>
          Добавить позицию
        </Button>
      </div>
    </Card>
  )
}

/* ─────────────── Загрузка фотографий позиции ─────────────── */

function PhotoUploader({
  photos,
  onChange,
  index,
}: {
  photos: ApplicationFormValues['items'][number]['photos']
  onChange: (next: ApplicationFormValues['items'][number]['photos']) => void
  index: number
}) {
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  async function handleFiles(files: File[]) {
    setBusy(true)
    try {
      const accepted: typeof photos = []

      for (const file of files) {
        if (!isAcceptedImage(file)) {
          toast.warning('Формат не поддерживается', `${file.name}: допустимы JPG, JPEG и PNG`)
          continue
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.warning('Файл слишком большой', `${file.name}: ${formatFileSize(file.size)} — предел 10 МБ`)
          continue
        }
        accepted.push(await fileToPhotoRef(file))
      }

      if (accepted.length) onChange([...photos, ...accepted])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 border-t border-hairline-soft pt-3">
      <div className="flex flex-wrap items-start gap-2.5">
        <FileDrop
          accept="image/jpeg,image/png"
          multiple
          compact
          disabled={busy}
          onFiles={handleFiles}
          icon="eye"
          title={busy ? 'Обработка…' : 'Фотографии ТМЦ'}
          hint="Перетащите сюда или выберите: JPG, PNG"
          className="w-full flex-1 sm:min-w-[16rem]"
        />

        {/* Миниатюры */}
        <AnimatePresence initial={false}>
          {photos.map((photo) => (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.18 }}
              className="group relative"
            >
              <button
                type="button"
                onClick={() => setPreview(photo.dataUrl)}
                aria-label={`Открыть ${photo.name}`}
                className="focus-ring block h-[4.5rem] w-[4.5rem] overflow-hidden rounded-md border border-hairline bg-surface-sunken"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.dataUrl}
                  alt={photo.name}
                  className="h-full w-full object-cover transition-transform duration-base group-hover:scale-105"
                />
              </button>
              <button
                type="button"
                onClick={() => onChange(photos.filter((p) => p.id !== photo.id))}
                aria-label={`Удалить ${photo.name}`}
                className="focus-ring absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-hairline bg-surface text-content-faint shadow-sm transition-colors hover:bg-danger-600 hover:text-white"
              >
                <Icon name="x" size={11} strokeWidth={2.4} />
              </button>
              <p className="mt-1 w-[4.5rem] truncate text-2xs text-content-faint" title={photo.name}>
                {photo.name}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Просмотр миниатюры в полный размер */}
      {preview ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Фотография позиции ${index + 1}`}
          className="fixed inset-0 z-modal flex items-center justify-center bg-overlay p-6"
          onClick={() => setPreview(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="max-h-full max-w-full rounded-md border border-hairline shadow-xl"
          />
          <button
            type="button"
            onClick={() => setPreview(null)}
            aria-label="Закрыть просмотр"
            className="focus-ring absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-surface text-content"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
      ) : null}
    </div>
  )
}
