import { status as statusColors, type StatusToken } from './tokens'
import type { ApplicationStatus, AccountStatus, Role, UserCategory } from '@/lib/types'

/**
 * СТАТУСЫ МАТЕРИАЛЬНОГО ПРОПУСКА (п. 8.9 ТЗ) → 8 токенов палитры.
 *
 * Один токен обслуживает несколько доменных статусов — колонки реестра
 * не пересекаются, поэтому переиспользование цвета не создаёт двусмысленности.
 *
 * Правило доступности: цвет НИКОГДА не единственный носитель смысла.
 * Каждый статус = цвет + собственная иконка-форма + текстовая метка.
 * Палитра остаётся читаемой при протанопии/дейтеранопии и в печати ч/б.
 */
export interface StatusMeta {
  key: ApplicationStatus
  /** Токен палитры, задающий цвет */
  token: StatusToken
  label: string
  shortLabel: string
  icon: string
  description: string
}

export const APPLICATION_STATUSES: Record<ApplicationStatus, StatusMeta> = {
  draft: {
    key: 'draft',
    token: 'draft',
    label: 'Черновик',
    shortLabel: 'Черновик',
    icon: 'circle-dashed',
    description: 'Заявка сохранена, но не отправлена',
  },
  pending_signature: {
    key: 'pending_signature',
    token: 'review',
    label: 'Ожидает подписания ЭЦП',
    shortLabel: 'Ожидает ЭЦП',
    icon: 'pen',
    description: 'Резидент РК: до подписания ЭЦП отправка заблокирована',
  },
  pending_passport: {
    key: 'pending_passport',
    token: 'review',
    label: 'Ожидает загрузки паспорта',
    shortLabel: 'Ожидает паспорт',
    icon: 'id-card',
    description: 'Нерезидент РК: без приложенного паспорта отправка заблокирована',
  },
  pending_object_admin: {
    key: 'pending_object_admin',
    token: 'review',
    label: 'На согласовании у администратора объекта',
    shortLabel: 'У администратора',
    icon: 'clock',
    description: 'Заявка направлена ответственному по выбранному объекту',
  },
  returned: {
    key: 'returned',
    token: 'unpaid',
    label: 'Возвращена на доработку',
    shortLabel: 'На доработке',
    icon: 'refresh',
    description: 'Требуются изменения со стороны заявителя',
  },
  rejected: {
    key: 'rejected',
    token: 'conflict',
    label: 'Отклонена',
    shortLabel: 'Отклонена',
    icon: 'x-circle',
    description: 'Процесс завершён отказом с зафиксированной причиной',
  },
  approved: {
    key: 'approved',
    token: 'paid',
    label: 'Согласована',
    shortLabel: 'Согласована',
    icon: 'check',
    description: 'Администратор объекта согласовал заявку',
  },
  pending_goc: {
    key: 'pending_goc',
    token: 'paid',
    label: 'На регистрации в ГОЦ',
    shortLabel: 'В ГОЦ',
    icon: 'inbox',
    description: 'Ожидается финальная регистрация Главным оперативным центром',
  },
  registered: {
    key: 'registered',
    token: 'confirmed',
    label: 'Зарегистрирована / Действует',
    shortLabel: 'Действует',
    icon: 'check-double',
    description: 'Пропуск зарегистрирован и действителен в выбранную дату',
  },
  expired: {
    key: 'expired',
    token: 'done',
    label: 'Истекла',
    shortLabel: 'Истекла',
    icon: 'calendar-x',
    description: 'Дата действия завершилась; запись из реестра не удаляется',
  },
  cancelled: {
    key: 'cancelled',
    token: 'void',
    label: 'Аннулирована',
    shortLabel: 'Аннулирована',
    icon: 'ban',
    description: 'Документ отменён уполномоченным лицом с указанием причины',
  },
}

export const APPLICATION_STATUS_KEYS = Object.keys(APPLICATION_STATUSES) as ApplicationStatus[]

export function getStatusMeta(key: ApplicationStatus): StatusMeta {
  return APPLICATION_STATUSES[key] ?? APPLICATION_STATUSES.draft
}

export function getStatusColors(key: ApplicationStatus) {
  return statusColors[getStatusMeta(key).token]
}

/** Статусы, в которых заявка ещё в работе — для счётчиков очередей */
export const ACTIVE_STATUSES: ApplicationStatus[] = [
  'draft',
  'pending_signature',
  'pending_passport',
  'pending_object_admin',
  'returned',
  'approved',
  'pending_goc',
]

/* ─────────────── Статусы учётной записи (п. 5.2 ТЗ) ─────────────── */

/**
 * Семь статусов учётной записи. Токен палитры задаёт цвет бейджа:
 * серый — черновой, янтарный — ждёт решения, бирюзовый — активна,
 * оранжевый — нужны правки, красный — отказ, вишнёвый — блокировка,
 * фиолетовый — выведена из обращения.
 *
 * `loginMessage` — что видит пользователь, если пытается войти с этим
 * статусом. Вход разрешён только при `active`.
 */
export const ACCOUNT_STATUSES: Record<
  AccountStatus,
  {
    label: string
    token: StatusToken
    icon: string
    description: string
    loginMessage: string
  }
> = {
  email_unconfirmed: {
    label: 'Не подтверждён e-mail',
    token: 'draft',
    icon: 'mail',
    description: 'Регистрация начата, владение почтой не подтверждено кодом',
    loginMessage: 'Подтвердите e-mail. Код подтверждения направлен на указанный адрес.',
  },
  pending_admin_confirmation: {
    label: 'Ожидает подтверждения',
    token: 'review',
    icon: 'clock',
    description: 'E-mail подтверждён, учётная запись ожидает решения администратора',
    loginMessage: 'Аккаунт ожидает подтверждения администратором.',
  },
  active: {
    label: 'Активна',
    token: 'confirmed',
    icon: 'check',
    description: 'Учётная запись подтверждена, процессы доступны',
    loginMessage: '',
  },
  needs_clarification: {
    label: 'На уточнении',
    token: 'unpaid',
    icon: 'refresh',
    description: 'Администратор запросил уточнение сведений',
    loginMessage: 'Требуется уточнение данных, проверьте e-mail.',
  },
  rejected: {
    label: 'Отклонена',
    token: 'conflict',
    icon: 'x-circle',
    description: 'В регистрации отказано с зафиксированной причиной',
    loginMessage: 'Регистрация отклонена.',
  },
  blocked: {
    label: 'Заблокирована',
    token: 'void',
    icon: 'lock',
    description: 'Доступ временно ограничен администратором',
    loginMessage: 'Доступ ограничен, обратитесь к администратору.',
  },
  deactivated: {
    label: 'Деактивирована',
    token: 'done',
    icon: 'ban',
    description: 'Учётная запись выведена из обращения',
    loginMessage: 'Доступ ограничен, обратитесь к администратору.',
  },
}

export const ACCOUNT_STATUS_KEYS = Object.keys(ACCOUNT_STATUSES) as AccountStatus[]

/** Статусы, требующие внимания администратора учётных записей */
export const REGISTRATION_QUEUE_STATUSES: AccountStatus[] = [
  'pending_admin_confirmation',
  'needs_clarification',
]

/* ─────────────── Роли и категории ─────────────── */

export const ROLES: Record<Role, { label: string; short: string; icon: string; scope: string }> = {
  user: {
    label: 'Пользователь',
    short: 'Пользователь',
    icon: 'user',
    scope: 'Свой профиль, создание и отправка собственных заявок, статусы, документы',
  },
  super_admin: {
    label: 'Суперадминистратор',
    short: 'Суперадмин',
    icon: 'sliders',
    scope: 'Полный доступ: пользователи, роли, объекты, справочники, реестры, аудит',
  },
  account_admin: {
    label: 'Администратор учётных записей',
    short: 'Админ УЗ',
    icon: 'users',
    scope: 'Подтверждение регистраций, профили, блокировка, назначение ролей',
  },
  object_admin: {
    label: 'Администратор объекта',
    short: 'Админ объекта',
    icon: 'building',
    scope: 'Рассмотрение пропусков по закреплённым объектам: согласовать, вернуть, отклонить',
  },
  goc_officer: {
    label: 'Сотрудник Главного оперативного центра',
    short: 'Сотрудник ГОЦ',
    icon: 'shield',
    scope: 'Финальная регистрация пропусков, присвоение номера, ведение реестра',
  },
  auditor: {
    label: 'Аудитор / просмотр',
    short: 'Аудитор',
    icon: 'eye',
    scope: 'Чтение реестров и истории в пределах назначенных процессов и объектов',
  },
}

export const USER_CATEGORIES: Record<UserCategory, { label: string; requiresOrganization: boolean }> =
  {
    employee: { label: 'Сотрудник Общества', requiresOrganization: false },
    tenant: { label: 'Арендатор', requiresOrganization: true },
    counterparty: { label: 'Контрагент', requiresOrganization: true },
    contractor: { label: 'Подрядчик / представитель иной организации', requiresOrganization: true },
    other: { label: 'Иной пользователь', requiresOrganization: false },
  }

/* ─────────────── Операция ─────────────── */

export const OPERATIONS = {
  in: { label: 'Внос', icon: 'arrow-down', description: 'Внос ТМЦ на территорию объекта' },
  out: { label: 'Вынос', icon: 'arrow-up', description: 'Вынос ТМЦ с территории объекта' },
} as const
