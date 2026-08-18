import type { Application, TimelineEntry } from './types'

/**
 * ТАЙМЛАЙН ЗАЯВКИ.
 *
 * Основной источник — массив `timeline`, который наполняют действия стора.
 * Если история пуста (заявка пришла из внешнего источника либо создана
 * до появления аудита), собираем правдоподобную последовательность из
 * текущего статуса и известных отметок времени, чтобы карточка не
 * оставалась пустой.
 *
 * Синтетические записи помечены `synthetic: true` — интерфейс показывает
 * их приглушённо и подписывает, что история восстановлена.
 */

export interface TimelineView extends TimelineEntry {
  synthetic?: boolean
}

/** Порядок прохождения маршрута — на нём строится восстановление истории */
const ROUTE_ORDER: Record<Application['status'], number> = {
  draft: 0,
  pending_signature: 1,
  pending_passport: 1,
  pending_object_admin: 2,
  returned: 3,
  rejected: 3,
  approved: 4,
  pending_goc: 4,
  registered: 5,
  expired: 6,
  cancelled: 6,
}

export function buildTimeline(application: Application): TimelineView[] {
  if (application.timeline?.length) return application.timeline

  const stage = ROUTE_ORDER[application.status] ?? 0
  const entries: TimelineView[] = []
  let seq = 0

  /**
   * Курсор времени: восстановленные отметки берутся из разных полей
   * (createdAt, signedAt, approvedAt…), и порознь они могут идти вразнобой.
   * Лента обязана читаться сверху вниз, поэтому каждая следующая запись
   * не может быть раньше предыдущей.
   */
  let cursor = application.createdAt

  const push = (
    at: string,
    actorId: string,
    actorName: string,
    action: TimelineEntry['action'],
    statusAfter: Application['status'],
    comment?: string,
  ) => {
    seq += 1
    const stamp = new Date(at).getTime() >= new Date(cursor).getTime() ? at : cursor
    cursor = stamp

    entries.push({
      id: `${application.id}-syn-${seq}`,
      at: stamp,
      actorId,
      actorName,
      action,
      statusAfter,
      comment,
      synthetic: true,
    })
  }

  const applicant = { id: application.applicantId, name: application.applicantName }

  push(application.createdAt, applicant.id, applicant.name, 'created', 'draft')

  if (stage >= 1) {
    if (application.isNonResident) {
      push(
        application.createdAt,
        applicant.id,
        applicant.name,
        'passport_uploaded',
        'pending_passport',
        'Приложен документ, удостоверяющий личность',
      )
    } else if (application.edsSignature) {
      push(
        application.edsSignature.signedAt,
        applicant.id,
        applicant.name,
        'signed',
        'pending_signature',
        'Заявка подписана ЭЦП',
      )
    }
  }

  if (stage >= 2) {
    push(application.createdAt, applicant.id, applicant.name, 'submitted', 'pending_object_admin')
  }

  if (application.status === 'returned') {
    push(
      application.updatedAt,
      application.objectAdminId ?? 'system',
      application.objectAdminName ?? 'Администратор объекта',
      'returned',
      'returned',
      application.decisionComment,
    )
    return entries
  }

  if (application.status === 'rejected') {
    push(
      application.updatedAt,
      application.objectAdminId ?? 'system',
      application.objectAdminName ?? 'Администратор объекта',
      'rejected',
      'rejected',
      application.decisionComment,
    )
    return entries
  }

  if (stage >= 4 && application.approvedAt) {
    push(
      application.approvedAt,
      application.objectAdminId ?? 'system',
      application.objectAdminName ?? 'Администратор объекта',
      'approved',
      'pending_goc',
    )
  }

  if (stage >= 5 && application.registeredAt) {
    push(
      application.registeredAt,
      application.gocOfficerId ?? 'system',
      application.gocOfficerName ?? 'Главный оперативный центр',
      'registered',
      'registered',
      application.registrationNumber ? `Присвоен номер ${application.registrationNumber}` : undefined,
    )
  }

  if (application.status === 'expired') {
    push(application.updatedAt, 'system', 'Система', 'expired', 'expired', 'Дата действия завершилась')
  }

  if (application.status === 'cancelled') {
    push(
      application.updatedAt,
      application.gocOfficerId ?? 'system',
      application.gocOfficerName ?? 'Главный оперативный центр',
      'cancelled',
      'cancelled',
      application.decisionComment,
    )
  }

  return entries
}

/** Подписи действий таймлайна */
export const ACTION_META: Record<TimelineEntry['action'], { icon: string; label: string }> = {
  created: { icon: 'plus', label: 'Заявка создана' },
  signed: { icon: 'pen', label: 'Подписано ЭЦП' },
  passport_uploaded: { icon: 'id-card', label: 'Приложен паспорт' },
  submitted: { icon: 'arrow-right', label: 'Отправлена на согласование' },
  approved: { icon: 'check', label: 'Согласована администратором объекта' },
  returned: { icon: 'refresh', label: 'Возвращена на доработку' },
  rejected: { icon: 'x-circle', label: 'Отклонена' },
  registered: { icon: 'stamp', label: 'Зарегистрирована в ГОЦ' },
  cancelled: { icon: 'ban', label: 'Аннулирована' },
  expired: { icon: 'calendar-x', label: 'Срок действия истёк' },
}
