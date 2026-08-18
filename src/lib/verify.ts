import type { Application } from './types'

/**
 * ЛОГИКА ПУБЛИЧНОЙ ПРОВЕРКИ ПРОПУСКА (п. 8.11 ТЗ).
 *
 * Отделена от разметки: определение вердикта и объём раскрываемых
 * сведений — правила предметной области, а не оформление. Их нужно
 * уметь проверить отдельно от интерфейса.
 */

export type Verdict = 'valid' | 'expired' | 'cancelled' | 'not_found'

export const VERDICTS: Record<
  Verdict,
  { label: string; icon: string; classes: string; note: string }
> = {
  valid: {
    label: 'ДЕЙСТВИТЕЛЕН',
    icon: 'check-circle',
    classes: 'border-status-confirmed-border bg-status-confirmed-soft text-status-confirmed-text',
    note: 'Пропуск зарегистрирован и действует в указанную дату',
  },
  expired: {
    label: 'ИСТЁК',
    icon: 'calendar-x',
    classes: 'border-status-draft-border bg-status-draft-soft text-status-draft-text',
    note: 'Дата действия документа завершилась',
  },
  cancelled: {
    label: 'АННУЛИРОВАН',
    icon: 'ban',
    classes: 'border-status-conflict-border bg-status-conflict-soft text-status-conflict-text',
    note: 'Документ отменён уполномоченным лицом',
  },
  not_found: {
    label: 'НЕ НАЙДЕН',
    icon: 'alert-triangle',
    classes: 'border-status-conflict-border bg-status-conflict-soft text-status-conflict-text',
    note: 'Документ с указанным номером в реестре отсутствует',
  },
}

/**
 * Вердикт по заявке и текущей дате.
 *
 * Порядок проверок важен: аннулирование сильнее истечения срока —
 * документ, отменённый уполномоченным лицом, не должен показываться
 * как «просто просроченный». Незарегистрированная заявка публично
 * не существует: у неё нет номера, по которому её можно найти.
 */
export function resolveVerdict(application: Application | undefined, today: string): Verdict {
  if (!application?.registrationNumber) return 'not_found'
  if (application.status === 'cancelled') return 'cancelled'
  if (application.status === 'expired' || application.validDate < today) return 'expired'
  if (application.status === 'registered') return 'valid'
  return 'not_found'
}

/**
 * Ф.И.О. в допустимом объёме: фамилия и инициалы.
 * Полное имя на публичной странице избыточно (п. 8.11 ТЗ).
 */
export function maskName(fullName: string) {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]

  const initials = parts
    .slice(1)
    .map((part) => `${part[0]}.`)
    .join('')

  return `${parts[0]} ${initials}`
}
