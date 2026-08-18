/**
 * МОДЕЛЬ ДАННЫХ QazExpoPass — Этап 1 (материальный пропуск на внос/вынос ТМЦ).
 *
 * Разделение по п. 4 ТЗ: КАТЕГОРИЯ пользователя (кем он является по отношению
 * к Обществу) и РОЛЬ (что ему разрешено делать) хранятся раздельно.
 * Один пользователь может иметь несколько ролей.
 */

/* ─────────────── Пользователи, роли, категории ─────────────── */

/** Системная роль — что пользователю разрешено делать (п. 4.2 ТЗ) */
export type Role =
  | 'user'
  | 'super_admin'
  | 'account_admin'
  | 'object_admin'
  | 'goc_officer'
  | 'auditor'

/** Категория пользователя — кем он является Обществу (п. 4.1 ТЗ) */
export type UserCategory =
  | 'employee'
  | 'tenant'
  | 'counterparty'
  | 'contractor'
  | 'other'

/** Статус учётной записи (п. 5.2 ТЗ) */
export type AccountStatus =
  | 'email_unconfirmed'
  | 'pending_admin_confirmation'
  | 'active'
  | 'needs_clarification'
  | 'rejected'
  | 'blocked'
  | 'deactivated'

export interface User {
  id: string
  lastName: string
  firstName: string
  middleName?: string
  email: string
  phone: string
  category: UserCategory
  /** Организация — обязательна для арендатора, контрагента, подрядчика */
  organization?: string
  /** Кабинет / помещение — по настройке Заказчика */
  workplace?: string
  roles: Role[]
  /** Объекты, закреплённые за пользователем: размещение арендатора либо
   *  зона ответственности администратора объекта */
  objectIds: string[]
  accountStatus: AccountStatus
  /** Признак нерезидента РК — определяет способ подтверждения заявки */
  isNonResident: boolean
  createdAt: string

  /* ── Регистрация и её рассмотрение (п. 5.2 ТЗ) ── */
  /**
   * Пароль в прототипе хранится как есть и по-настоящему не проверяется.
   * В промышленной версии — только стойкий хэш с солью (п. 14 ТЗ).
   */
  password?: string
  /** Согласие на обработку персональных данных: дата/время и версия текста */
  consent?: {
    acceptedAt: string
    version: string
  }
  /** Причина отклонения регистрации — показывается пользователю при входе */
  rejectionReason?: string
  /** Комментарий администратора при возврате на уточнение */
  clarificationComment?: string
  /** Кто и когда рассмотрел регистрацию */
  reviewedBy?: string
  reviewedAt?: string
}

/* ─────────────── Запрос на изменение профиля ─────────────── */

/**
 * Изменение категории, организации или закреплённых объектов требует
 * повторного подтверждения администратором (п. 5.3 ТЗ), поэтому такие
 * правки не применяются сразу, а создают запрос на рассмотрение.
 */
export interface ProfileChangeRequest {
  id: string
  userId: string
  userName: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
  /** Что было на момент подачи — чтобы администратор видел разницу */
  current: {
    category: UserCategory
    organization?: string
    objectIds: string[]
  }
  /** Что просит установить пользователь */
  requested: {
    category: UserCategory
    organization?: string
    objectIds: string[]
  }
  /** Обоснование — обязательно */
  reason: string
  /** Решение администратора */
  reviewedBy?: string
  reviewedAt?: string
  decisionComment?: string
}

/* ─────────────── Уведомления (п. 11 ТЗ) ─────────────── */

/**
 * Уведомление в личном кабинете. Обязательные каналы по ТЗ — кабинет
 * и e-mail; в прототипе реализован только внутрисистемный канал.
 */
export interface AppNotification {
  id: string
  userId: string
  at: string
  kind:
    | 'registration_submitted'
    | 'registration_approved'
    | 'registration_rejected'
    | 'registration_clarification'
    | 'application'
  title: string
  body?: string
  read: boolean
  /** Куда ведёт уведомление при клике */
  href?: string
}

/* ─────────────── Справочник объектов ─────────────── */

/** Объект / павильон / блок комплекса (Приложение 1 ТЗ) */
export interface SiteObject {
  id: string
  /** Наименования KZ/RU/EN — справочник трёхъязычный */
  nameRu: string
  nameKk: string
  nameEn: string
  /** Порядок отображения — настраивается администратором */
  order: number
  isActive: boolean
  /** Основной администратор объекта */
  adminUserId?: string
  /** Резервный согласующий на период замещения */
  backupAdminUserId?: string
}

/* ─────────────── Заявка на материальный пропуск ─────────────── */

/** Операция: взаимоисключающий выбор (п. 8.2 ТЗ) */
export type Operation = 'in' | 'out'

/** Статусы материального пропуска (п. 8.9 ТЗ) */
export type ApplicationStatus =
  | 'draft'
  | 'pending_signature'
  | 'pending_passport'
  | 'pending_object_admin'
  | 'returned'
  | 'rejected'
  | 'approved'
  | 'pending_goc'
  | 'registered'
  | 'expired'
  | 'cancelled'

/** Способ подтверждения заявителя (п. 8.5 ТЗ) */
export type ConfirmationMethod = 'eds' | 'passport'

/**
 * Изображение, приложенное к заявке.
 *
 * В прототипе файл не уходит на сервер: он уменьшается до миниатюры
 * и хранится как dataURL прямо в состоянии. Уменьшение обязательно —
 * localStorage не переживёт оригиналов с телефона.
 */
export interface PhotoRef {
  id: string
  name: string
  size: number
  /** Миниатюра в формате dataURL (JPEG) */
  dataUrl: string
}

/** Позиция таблицы ТМЦ (п. 8.3 ТЗ) */
export interface InventoryItem {
  id: string
  name: string
  quantity: number
  /** Только значения справочника — см. UNITS ниже */
  unit: Unit
  model?: string
  serialNumber?: string
  distinctiveFeatures?: string
  /** Фотографии позиции: JPG/JPEG/PNG */
  photos: PhotoRef[]
  note?: string
}

/** Вложение: паспорт нерезидента либо подтверждающий документ */
export interface Attachment {
  id: string
  fileName: string
  /** Размер в байтах — отображается в списке вложений */
  size: number
  mimeType: string
  uploadedAt: string
  kind: 'passport' | 'supporting' | 'photo'
  /** Превью для изображений; PDF превью не имеет */
  dataUrl?: string
}

/** Запись таймлайна: любое действие по маршруту (п. 15 ТЗ — аудит) */
export interface TimelineEntry {
  id: string
  at: string
  /** Кто выполнил действие */
  actorId: string
  actorName: string
  action:
    | 'created'
    | 'signed'
    | 'passport_uploaded'
    | 'submitted'
    | 'approved'
    | 'returned'
    | 'rejected'
    | 'registered'
    | 'cancelled'
    | 'expired'
  /** Комментарий: обязателен при возврате и отклонении */
  comment?: string
  statusAfter: ApplicationStatus
}

export interface Application {
  id: string
  /** Номер заявки — присваивается при создании */
  applicationNumber: string
  /** Регистрационный номер пропуска — присваивается ГОЦ при регистрации */
  registrationNumber?: string

  /* Заявитель: подстановка из профиля, подмена запрещена (п. 8.2 ТЗ) */
  applicantId: string
  applicantName: string
  organization: string
  workplace?: string

  /* Основные реквизиты */
  operation: Operation
  objectId: string
  /** Основание: договор, письмо, мероприятие, монтаж/демонтаж и т.п. */
  basis: string
  /** Ровно одна календарная дата. Диапазон «с/по» запрещён (п. 8.4 ТЗ) */
  validDate: string

  items: InventoryItem[]
  attachments: Attachment[]

  /* Подтверждение заявителя (п. 8.5 ТЗ) */
  isNonResident: boolean
  confirmationMethod?: ConfirmationMethod
  /** Сведения об ЭЦП — фиксируются при успешной подписи */
  edsSignature?: {
    signedAt: string
    certificateSubject: string
    certificateSerial: string
    /** Хэш подписанной версии: изменение данных требует повторной ЭЦП */
    dataHash: string
  }

  status: ApplicationStatus

  /* Маршрут согласования (п. 8.8 ТЗ) */
  objectAdminId?: string
  objectAdminName?: string
  approvedAt?: string
  gocOfficerId?: string
  gocOfficerName?: string
  registeredAt?: string

  /** Причина возврата, отклонения либо аннулирования */
  decisionComment?: string

  timeline: TimelineEntry[]
  createdAt: string
  updatedAt: string
}

/* ─────────────── Справочники ─────────────── */

/** Единицы измерения ТМЦ — ведутся в справочнике (п. 8.3 ТЗ) */
export const UNITS = ['шт', 'компл', 'упак', 'кг', 'м', 'м²', 'м³', 'л', 'рулон', 'ящик'] as const
export type Unit = (typeof UNITS)[number]
