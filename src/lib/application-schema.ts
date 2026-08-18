import { z } from 'zod'
import { UNITS } from './types'

/**
 * СХЕМА ЗАЯВКИ НА МАТЕРИАЛЬНЫЙ ПРОПУСК (раздел 8 ТЗ).
 *
 * Схема разбита по шагам мастера: каждый шаг проверяется отдельно,
 * поэтому «Далее» блокируется ровно тем, что относится к текущему экрану,
 * а не всей формой сразу.
 */

const photoSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
  dataUrl: z.string(),
})

/* ── Шаг 1: данные заявки ── */
export const stepDataSchema = z.object({
  /** Взаимоисключающий выбор — ключевое правило п. 8.2 ТЗ */
  operation: z.enum(['in', 'out'], {
    errorMap: () => ({ message: 'Выберите операцию: внос либо вынос' }),
  }),
  objectId: z.string().min(1, 'Выберите объект'),
  /** Ровно одна календарная дата: диапазона «с/по» в модели нет (п. 8.4 ТЗ) */
  validDate: z.string().min(1, 'Укажите дату действия пропуска'),
  basis: z
    .string()
    .trim()
    .min(10, 'Опишите основание подробнее — не менее 10 символов')
    .max(1000, 'Основание не должно превышать 1000 символов'),
  workplace: z.string().max(200).optional(),
})

/* ── Шаг 2: таблица ТМЦ ── */
export const inventoryItemSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(2, 'Укажите наименование'),
  quantity: z
    .number({ invalid_type_error: 'Количество должно быть числом' })
    .positive('Количество должно быть больше нуля')
    .max(1_000_000, 'Проверьте количество'),
  unit: z.enum(UNITS),
  model: z.string().max(200).optional(),
  serialNumber: z.string().max(120).optional(),
  distinctiveFeatures: z.string().max(300).optional(),
  photos: z.array(photoSchema),
  note: z.string().max(300).optional(),
})

export const stepItemsSchema = z.object({
  /** Минимум одна позиция обязательна (п. 8.3 ТЗ) */
  items: z.array(inventoryItemSchema).min(1, 'Добавьте хотя бы одну позицию ТМЦ'),
})

/* ── Шаг 3: подтверждение личности ── */
const edsSignatureSchema = z.object({
  signedAt: z.string(),
  certificateSubject: z.string(),
  certificateSerial: z.string(),
  dataHash: z.string(),
  validUntil: z.string().optional(),
})

const attachmentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  size: z.number(),
  mimeType: z.string(),
  uploadedAt: z.string(),
  kind: z.enum(['passport', 'supporting', 'photo']),
  dataUrl: z.string().optional(),
})

/**
 * Взаимоисключающее бизнес-правило п. 8.5 ТЗ.
 * Резидент РК: ЭЦП обязательна. Нерезидент РК: ЭЦП не требуется,
 * но паспорт обязателен. Проверка на уровне схемы, а не только интерфейса.
 */
export const stepIdentitySchema = z
  .object({
    isNonResident: z.boolean(),
    edsSignature: edsSignatureSchema.optional(),
    attachments: z.array(attachmentSchema),
  })
  .superRefine((value, ctx) => {
    const hasPassport = value.attachments.some((f) => f.kind === 'passport')

    if (value.isNonResident && !hasPassport) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['attachments'],
        message: 'Приложите копию паспорта — без документа отправка заблокирована',
      })
    }

    if (!value.isNonResident && !value.edsSignature) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['edsSignature'],
        message: 'Подпишите заявку ЭЦП — без подписи отправка заблокирована',
      })
    }
  })

/* ── Полная форма ── */
export const applicationFormSchema = z.object({
  ...stepDataSchema.shape,
  ...stepItemsSchema.shape,
  isNonResident: z.boolean(),
  edsSignature: edsSignatureSchema.optional(),
  attachments: z.array(attachmentSchema),
})

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>
export type InventoryItemValues = z.infer<typeof inventoryItemSchema>

/** Поля, относящиеся к каждому шагу — для точечной валидации при переходе */
export const STEP_FIELDS = {
  data: ['operation', 'objectId', 'validDate', 'basis'],
  items: ['items'],
  identity: ['isNonResident', 'edsSignature', 'attachments'],
} as const

export function makeEmptyItem(): InventoryItemValues {
  return {
    id: `row-${Math.random().toString(36).slice(2, 9)}`,
    name: '',
    quantity: 1,
    unit: 'шт',
    model: '',
    serialNumber: '',
    distinctiveFeatures: '',
    photos: [],
    note: '',
  }
}
