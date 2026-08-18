'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { SEED_APPLICATIONS, SEED_OBJECTS, SEED_USERS } from '@/lib/seed'
import { CONSENT_VERSION } from '@/lib/validation'
import type {
  AccountStatus,
  AppNotification,
  Application,
  ApplicationStatus,
  ProfileChangeRequest,
  Role,
  SiteObject,
  TimelineEntry,
  User,
  UserCategory,
} from '@/lib/types'

/**
 * СОСТОЯНИЕ ПРОТОТИПА.
 *
 * Реального бэкенда нет: users / objects / applications хранятся в
 * localStorage через persist. При первом запуске (пустое хранилище)
 * middleware засеивает начальные данные из lib/seed.ts.
 *
 * Все переходы по маршруту согласования — чистые функции над стором,
 * каждая пишет запись в timeline заявки (прообраз аудита, п. 15 ТЗ).
 */

export type Language = 'ru' | 'kk' | 'en'
export type Theme = 'light' | 'dark'

/** Результат попытки входа: либо успех, либо причина отказа */
export type LoginResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'not_found' | 'wrong_password' | 'inactive'; user?: User }

/** Черновик регистрации — то, что собрала форма до создания учётной записи */
export interface RegistrationDraft {
  lastName: string
  firstName: string
  middleName?: string
  email: string
  phone: string
  category: UserCategory
  organization?: string
  objectIds: string[]
  password: string
  isNonResident: boolean
}

interface AppState {
  /* ── Данные ── */
  users: User[]
  objects: SiteObject[]
  applications: Application[]
  notifications: AppNotification[]
  profileChangeRequests: ProfileChangeRequest[]

  /* ── Сессия (вход без реальной авторизации — допустимо для прототипа) ── */
  currentUserId: string | null
  /** Активная роль, если у пользователя их несколько */
  activeRole: Role | null

  /* ── Интерфейс ── */
  language: Language
  theme: Theme
  sidebarCollapsed: boolean

  /* ── Действия сессии ── */
  login: (userId: string) => void
  /** Вход по e-mail и паролю; возвращает причину отказа для показа пользователю */
  loginByEmail: (email: string, password: string) => LoginResult
  logout: () => void
  setActiveRole: (role: Role) => void

  /* ── Регистрация ── */
  isEmailTaken: (email: string) => boolean
  /** Создаёт учётную запись после подтверждения e-mail кодом */
  registerUser: (draft: RegistrationDraft) => string
  /** Решения администратора учётных записей по очереди регистраций */
  approveRegistration: (
    userId: string,
    patch?: { category?: UserCategory; organization?: string; objectIds?: string[]; roles?: Role[] },
  ) => void
  rejectRegistration: (userId: string, reason: string) => void
  requestClarification: (userId: string, comment: string) => void

  /* ── Уведомления ── */
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (userId: string) => void

  /* ── Личный кабинет ── */
  /** Правки, которые пользователь применяет сам: Ф.И.О. и телефон */
  updateOwnProfile: (
    userId: string,
    patch: Pick<User, 'lastName' | 'firstName' | 'phone'> & { middleName?: string },
  ) => void
  /** Смена пароля из раздела «Безопасность» */
  changePassword: (userId: string, newPassword: string) => void
  /**
   * Запрос на изменение категории, организации или объектов.
   * Изменения НЕ применяются сразу — их рассматривает администратор.
   */
  createProfileChangeRequest: (
    userId: string,
    requested: ProfileChangeRequest['requested'],
    reason: string,
  ) => string

  /* ── Интерфейс ── */
  setLanguage: (language: Language) => void
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void

  /* ── Заявки ── */
  createApplication: (draft: Omit<Application, 'id' | 'applicationNumber' | 'timeline' | 'createdAt' | 'updatedAt'>) => string
  updateApplication: (id: string, patch: Partial<Application>) => void
  deleteApplication: (id: string) => void
  /** Подписание ЭЦП резидентом либо загрузка паспорта нерезидентом + отправка */
  submitApplication: (id: string) => void
  approveByObjectAdmin: (id: string, comment?: string) => void
  returnForRevision: (id: string, comment: string) => void
  rejectApplication: (id: string, comment: string) => void
  registerByGoc: (id: string) => void
  cancelApplication: (id: string, comment: string) => void
  /** Пересчёт статуса «Истекла» по текущей дате */
  refreshExpired: () => void

  /* ── Администрирование ── */
  updateUser: (id: string, patch: Partial<User>) => void
  addObject: (object: Omit<SiteObject, 'id'>) => void
  updateObject: (id: string, patch: Partial<SiteObject>) => void

  /* ── Служебное ── */
  resetToSeed: () => void
}

/* ─────────────── Вспомогательное ─────────────── */

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`

function nowIso() {
  return new Date().toISOString()
}

/** Сегодняшняя дата в формате YYYY-MM-DD (локальное время Астаны) */
export function todayIso() {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

export function fullName(user: Pick<User, 'lastName' | 'firstName' | 'middleName'>) {
  return [user.lastName, user.firstName, user.middleName].filter(Boolean).join(' ')
}

/** Следующий номер заявки — сквозной счётчик прототипа */
function nextApplicationNumber(applications: Application[]) {
  const max = applications.reduce((acc, app) => {
    const parsed = Number(app.applicationNumber.split('-').pop())
    return Number.isFinite(parsed) && parsed > acc ? parsed : acc
  }, 0)
  return `ЗВ-2026-${String(max + 1).padStart(6, '0')}`
}

/** Следующий регистрационный номер пропуска — присваивает ГОЦ */
function nextRegistrationNumber(applications: Application[]) {
  const max = applications.reduce((acc, app) => {
    if (!app.registrationNumber) return acc
    const parsed = Number(app.registrationNumber.split('-').pop())
    return Number.isFinite(parsed) && parsed > acc ? parsed : acc
  }, 0)
  return `МП-2026-${String(max + 1).padStart(6, '0')}`
}

function makeEntry(
  actor: { id: string; name: string },
  action: TimelineEntry['action'],
  statusAfter: ApplicationStatus,
  comment?: string,
): TimelineEntry {
  return {
    id: uid('tl'),
    at: nowIso(),
    actorId: actor.id,
    actorName: actor.name,
    action,
    statusAfter,
    comment,
  }
}

/** Уведомление в личном кабинете (п. 11 ТЗ) */
function makeNotification(
  userId: string,
  kind: AppNotification['kind'],
  title: string,
  body?: string,
  href?: string,
): AppNotification {
  return { id: uid('ntf'), userId, at: nowIso(), kind, title, body, read: false, href }
}

/**
 * Уведомление заявителю о переходе его заявки по маршруту (п. 11 ТЗ).
 * Обязательных каналов два — кабинет и e-mail; в прототипе письмо
 * не отправляется, поэтому канал один, но состав событий тот же.
 */
function notifyApplicant(
  application: Application,
  title: string,
  body?: string,
): AppNotification {
  return makeNotification(
    application.applicantId,
    'application',
    title,
    body,
    `/applications/view?id=${application.id}`,
  )
}

/** Уведомление всем сотрудникам Главного оперативного центра */
function notifyGoc(users: User[], application: Application): AppNotification[] {
  return users
    .filter((u) => u.roles.includes('goc_officer'))
    .map((officer) =>
      makeNotification(
        officer.id,
        'application',
        'Материальный пропуск передан в ГОЦ',
        `${application.applicationNumber} · ${application.applicantName}`,
        '/goc/queue',
      ),
    )
}

const INITIAL = {
  users: SEED_USERS,
  objects: SEED_OBJECTS,
  applications: SEED_APPLICATIONS,
  notifications: [] as AppNotification[],
  profileChangeRequests: [] as ProfileChangeRequest[],
  currentUserId: null,
  activeRole: null,
  language: 'ru' as Language,
  theme: 'light' as Theme,
  sidebarCollapsed: false,
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      /* ─────────────── Сессия ─────────────── */

      login: (userId) => {
        const user = get().users.find((u) => u.id === userId)
        if (!user) return
        set({ currentUserId: userId, activeRole: user.roles[0] ?? 'user' })
      },

      /**
       * Вход по e-mail и паролю. В прототипе пароль по-настоящему не
       * проверяется: достаточно любого непустого значения — механизм
       * хэширования относится к боевой реализации (п. 14 ТЗ).
       * Войти можно только с активной учётной записью.
       */
      loginByEmail: (email, password) => {
        const normalized = email.trim().toLowerCase()
        const user = get().users.find((u) => u.email.toLowerCase() === normalized)

        if (!user) return { ok: false, reason: 'not_found' }
        if (!password.trim()) return { ok: false, reason: 'wrong_password', user }
        if (user.accountStatus !== 'active') return { ok: false, reason: 'inactive', user }

        set({ currentUserId: user.id, activeRole: user.roles[0] ?? 'user' })
        return { ok: true, userId: user.id }
      },

      logout: () => set({ currentUserId: null, activeRole: null }),

      setActiveRole: (role) => set({ activeRole: role }),

      /* ─────────────── Регистрация ─────────────── */

      /** E-mail уникален среди всех учётных записей (п. 5.1 ТЗ) */
      isEmailTaken: (email) => {
        const normalized = email.trim().toLowerCase()
        return get().users.some((u) => u.email.toLowerCase() === normalized)
      },

      /**
       * Создание учётной записи после подтверждения владения почтой.
       * Статус — «Ожидает подтверждения администратором»: до решения
       * администратора доступ к созданию заявок закрыт (п. 5.2 ТЗ).
       */
      registerUser: (draft) => {
        const id = uid('usr')
        const at = nowIso()

        const user: User = {
          id,
          lastName: draft.lastName.trim(),
          firstName: draft.firstName.trim(),
          middleName: draft.middleName?.trim() || undefined,
          email: draft.email.trim(),
          phone: draft.phone.trim(),
          category: draft.category,
          organization: draft.organization?.trim() || undefined,
          roles: ['user'],
          objectIds: draft.objectIds,
          accountStatus: 'pending_admin_confirmation',
          isNonResident: draft.isNonResident,
          createdAt: at,
          password: draft.password,
          consent: { acceptedAt: at, version: CONSENT_VERSION },
        }

        const state = get()
        // Уведомление администраторам учётных записей о новой регистрации
        const admins = state.users.filter(
          (u) => u.roles.includes('account_admin') || u.roles.includes('super_admin'),
        )

        set({
          users: [...state.users, user],
          notifications: [
            ...state.notifications,
            ...admins.map((admin) =>
              makeNotification(
                admin.id,
                'registration_submitted',
                'Новая регистрация',
                `${user.lastName} ${user.firstName} — ${user.organization ?? 'без организации'}`,
                '/admin/registrations',
              ),
            ),
          ],
        })

        return id
      },

      /** Подтверждение регистрации; администратор может поправить данные и роли */
      approveRegistration: (userId, patch) =>
        set((s) => {
          const admin = s.users.find((u) => u.id === s.currentUserId)

          return {
            users: s.users.map((u) =>
              u.id === userId
                ? {
                    ...u,
                    ...patch,
                    roles: patch?.roles?.length ? patch.roles : u.roles,
                    accountStatus: 'active' as AccountStatus,
                    rejectionReason: undefined,
                    clarificationComment: undefined,
                    reviewedBy: admin ? fullName(admin) : undefined,
                    reviewedAt: nowIso(),
                  }
                : u,
            ),
            notifications: [
              ...s.notifications,
              makeNotification(
                userId,
                'registration_approved',
                'Учётная запись подтверждена',
                'Регистрация подтверждена администратором. Создание заявок доступно.',
                '/dashboard',
              ),
            ],
          }
        }),

      rejectRegistration: (userId, reason) =>
        set((s) => {
          if (!reason.trim()) return s
          const admin = s.users.find((u) => u.id === s.currentUserId)

          return {
            users: s.users.map((u) =>
              u.id === userId
                ? {
                    ...u,
                    accountStatus: 'rejected' as AccountStatus,
                    rejectionReason: reason,
                    clarificationComment: undefined,
                    reviewedBy: admin ? fullName(admin) : undefined,
                    reviewedAt: nowIso(),
                  }
                : u,
            ),
            notifications: [
              ...s.notifications,
              makeNotification(userId, 'registration_rejected', 'Регистрация отклонена', reason),
            ],
          }
        }),

      requestClarification: (userId, comment) =>
        set((s) => {
          if (!comment.trim()) return s
          const admin = s.users.find((u) => u.id === s.currentUserId)

          return {
            users: s.users.map((u) =>
              u.id === userId
                ? {
                    ...u,
                    accountStatus: 'needs_clarification' as AccountStatus,
                    clarificationComment: comment,
                    rejectionReason: undefined,
                    reviewedBy: admin ? fullName(admin) : undefined,
                    reviewedAt: nowIso(),
                  }
                : u,
            ),
            notifications: [
              ...s.notifications,
              makeNotification(
                userId,
                'registration_clarification',
                'Требуется уточнение данных',
                comment,
              ),
            ],
          }
        }),

      /* ─────────────── Уведомления ─────────────── */

      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllNotificationsRead: (userId) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.userId === userId ? { ...n, read: true } : n,
          ),
        })),

      /* ─────────────── Личный кабинет ─────────────── */

      /** Контактные данные пользователь меняет сам, без согласования */
      updateOwnProfile: (userId, patch) =>
        set((s) => ({
          users: s.users.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  lastName: patch.lastName.trim(),
                  firstName: patch.firstName.trim(),
                  middleName: patch.middleName?.trim() || undefined,
                  phone: patch.phone.trim(),
                }
              : u,
          ),
        })),

      changePassword: (userId, newPassword) =>
        set((s) => ({
          users: s.users.map((u) => (u.id === userId ? { ...u, password: newPassword } : u)),
        })),

      /**
       * Изменение категории, организации либо объектов размещения не
       * применяется сразу: создаётся запрос, который рассматривает
       * администратор учётных записей (п. 5.3 ТЗ).
       */
      createProfileChangeRequest: (userId, requested, reason) => {
        const state = get()
        const user = state.users.find((u) => u.id === userId)
        if (!user || !reason.trim()) return ''

        const id = uid('pcr')
        const request: ProfileChangeRequest = {
          id,
          userId,
          userName: fullName(user),
          createdAt: nowIso(),
          status: 'pending',
          current: {
            category: user.category,
            organization: user.organization,
            objectIds: user.objectIds,
          },
          requested,
          reason,
        }

        const admins = state.users.filter(
          (u) => u.roles.includes('account_admin') || u.roles.includes('super_admin'),
        )

        set({
          profileChangeRequests: [...state.profileChangeRequests, request],
          notifications: [
            ...state.notifications,
            ...admins.map((admin) =>
              makeNotification(
                admin.id,
                'registration_submitted',
                'Запрос на изменение профиля',
                `${fullName(user)} просит изменить сведения учётной записи`,
                '/admin/registrations',
              ),
            ),
          ],
        })

        return id
      },

      /* ─────────────── Интерфейс ─────────────── */

      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      /* ─────────────── Заявки ─────────────── */

      createApplication: (draft) => {
        const id = uid('app')
        const at = nowIso()
        const state = get()
        const actor = state.users.find((u) => u.id === draft.applicantId)

        const application: Application = {
          ...draft,
          id,
          applicationNumber: nextApplicationNumber(state.applications),
          createdAt: at,
          updatedAt: at,
          timeline: [
            makeEntry(
              { id: draft.applicantId, name: actor ? fullName(actor) : draft.applicantName },
              'created',
              draft.status,
            ),
          ],
        }

        set({ applications: [application, ...state.applications] })
        return id
      },

      updateApplication: (id, patch) =>
        set((s) => ({
          applications: s.applications.map((app) =>
            app.id === id ? { ...app, ...patch, updatedAt: nowIso() } : app,
          ),
        })),

      deleteApplication: (id) =>
        set((s) => ({ applications: s.applications.filter((app) => app.id !== id) })),

      /**
       * Отправка заявки. Взаимоисключающее правило п. 8.5 ТЗ:
       * резидент РК — без ЭЦП отправка заблокирована;
       * нерезидент РК — без паспорта отправка заблокирована.
       */
      submitApplication: (id) =>
        set((s) => {
          const app = s.applications.find((a) => a.id === id)
          if (!app) return s

          const hasPassport = app.attachments.some((f) => f.kind === 'passport')
          if (app.isNonResident && !hasPassport) return s
          if (!app.isNonResident && !app.edsSignature) return s

          const actorUser = s.users.find((u) => u.id === app.applicantId)
          const actor = {
            id: app.applicantId,
            name: actorUser ? fullName(actorUser) : app.applicantName,
          }

          // Администратор объекта берётся из справочника объектов
          const object = s.objects.find((o) => o.id === app.objectId)
          const admin = s.users.find((u) => u.id === object?.adminUserId)

          return {
            applications: s.applications.map((a) =>
              a.id === id
                ? {
                    ...a,
                    status: 'pending_object_admin' as ApplicationStatus,
                    confirmationMethod: a.isNonResident ? 'passport' : 'eds',
                    objectAdminId: admin?.id,
                    objectAdminName: admin ? fullName(admin) : undefined,
                    decisionComment: undefined,
                    updatedAt: nowIso(),
                    timeline: [...a.timeline, makeEntry(actor, 'submitted', 'pending_object_admin')],
                  }
                : a,
            ),
          }
        }),

      approveByObjectAdmin: (id, comment) =>
        set((s) => {
          const actorUser = s.users.find((u) => u.id === s.currentUserId)
          const target = s.applications.find((a) => a.id === id)
          if (!actorUser || !target) return s
          const actor = { id: actorUser.id, name: fullName(actorUser) }

          return {
            applications: s.applications.map((a) =>
              a.id === id
                ? {
                    ...a,
                    status: 'pending_goc' as ApplicationStatus,
                    objectAdminId: actorUser.id,
                    objectAdminName: fullName(actorUser),
                    approvedAt: nowIso(),
                    updatedAt: nowIso(),
                    timeline: [...a.timeline, makeEntry(actor, 'approved', 'pending_goc', comment)],
                  }
                : a,
            ),
            // Заявитель и следующий участник маршрута (п. 11 ТЗ)
            notifications: [
              ...s.notifications,
              notifyApplicant(
                target,
                'Заявка согласована',
                `${target.applicationNumber}: администратор объекта согласовал заявку, передана в ГОЦ`,
              ),
              ...notifyGoc(s.users, target),
            ],
          }
        }),

      returnForRevision: (id, comment) =>
        set((s) => {
          const actorUser = s.users.find((u) => u.id === s.currentUserId)
          const target = s.applications.find((a) => a.id === id)
          if (!actorUser || !target || !comment.trim()) return s
          const actor = { id: actorUser.id, name: fullName(actorUser) }

          return {
            applications: s.applications.map((a) =>
              a.id === id
                ? {
                    ...a,
                    status: 'returned' as ApplicationStatus,
                    decisionComment: comment,
                    updatedAt: nowIso(),
                    timeline: [...a.timeline, makeEntry(actor, 'returned', 'returned', comment)],
                  }
                : a,
            ),
            notifications: [
              ...s.notifications,
              notifyApplicant(
                target,
                'Заявка возвращена на доработку',
                `${target.applicationNumber}: ${comment}`,
              ),
            ],
          }
        }),

      rejectApplication: (id, comment) =>
        set((s) => {
          const actorUser = s.users.find((u) => u.id === s.currentUserId)
          const target = s.applications.find((a) => a.id === id)
          if (!actorUser || !target || !comment.trim()) return s
          const actor = { id: actorUser.id, name: fullName(actorUser) }

          return {
            applications: s.applications.map((a) =>
              a.id === id
                ? {
                    ...a,
                    status: 'rejected' as ApplicationStatus,
                    decisionComment: comment,
                    updatedAt: nowIso(),
                    timeline: [...a.timeline, makeEntry(actor, 'rejected', 'rejected', comment)],
                  }
                : a,
            ),
            notifications: [
              ...s.notifications,
              notifyApplicant(target, 'Заявка отклонена', `${target.applicationNumber}: ${comment}`),
            ],
          }
        }),

      /** Финальная регистрация ГОЦ: номер, статус «Действует», PDF + QR */
      registerByGoc: (id) =>
        set((s) => {
          const actorUser = s.users.find((u) => u.id === s.currentUserId)
          const target = s.applications.find((a) => a.id === id)
          if (!actorUser || !target) return s
          const actor = { id: actorUser.id, name: fullName(actorUser) }
          const registrationNumber = nextRegistrationNumber(s.applications)
          const applicant = s.users.find((u) => u.id === target.applicantId)

          return {
            applications: s.applications.map((a) =>
              a.id === id
                ? {
                    ...a,
                    status: 'registered' as ApplicationStatus,
                    registrationNumber,
                    gocOfficerId: actorUser.id,
                    gocOfficerName: fullName(actorUser),
                    registeredAt: nowIso(),
                    updatedAt: nowIso(),
                    timeline: [
                      ...a.timeline,
                      makeEntry(actor, 'registered', 'registered', `Присвоен номер ${registrationNumber}`),
                    ],
                  }
                : a,
            ),
            // Документ сформирован и «отправлен» заявителю (п. 8.10 ТЗ)
            notifications: [
              ...s.notifications,
              notifyApplicant(
                target,
                'Пропуск зарегистрирован',
                `${registrationNumber} · PDF с QR-кодом направлен на ${applicant?.email ?? 'указанный адрес'}`,
              ),
            ],
          }
        }),

      cancelApplication: (id, comment) =>
        set((s) => {
          const actorUser = s.users.find((u) => u.id === s.currentUserId)
          const target = s.applications.find((a) => a.id === id)
          if (!actorUser || !target || !comment.trim()) return s
          const actor = { id: actorUser.id, name: fullName(actorUser) }

          return {
            applications: s.applications.map((a) =>
              a.id === id
                ? {
                    ...a,
                    status: 'cancelled' as ApplicationStatus,
                    decisionComment: comment,
                    updatedAt: nowIso(),
                    timeline: [...a.timeline, makeEntry(actor, 'cancelled', 'cancelled', comment)],
                  }
                : a,
            ),
            notifications: [
              ...s.notifications,
              notifyApplicant(
                target,
                'Пропуск аннулирован',
                `${target.registrationNumber ?? target.applicationNumber}: ${comment}`,
              ),
            ],
          }
        }),

      /**
       * После окончания выбранной даты документ автоматически получает
       * статус «Истекла»; запись из реестра не удаляется (п. 8.4 ТЗ).
       */
      refreshExpired: () =>
        set((s) => {
          const today = todayIso()
          let changed = false

          const applications = s.applications.map((a) => {
            if (a.status !== 'registered' || a.validDate >= today) return a
            changed = true
            return {
              ...a,
              status: 'expired' as ApplicationStatus,
              updatedAt: nowIso(),
              timeline: [
                ...a.timeline,
                makeEntry(
                  { id: 'system', name: 'Система' },
                  'expired',
                  'expired',
                  'Дата действия завершилась',
                ),
              ],
            }
          })

          return changed ? { applications } : s
        }),

      /* ─────────────── Администрирование ─────────────── */

      updateUser: (id, patch) =>
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),

      addObject: (object) =>
        set((s) => ({ objects: [...s.objects, { ...object, id: uid('obj') }] })),

      updateObject: (id, patch) =>
        set((s) => ({ objects: s.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),

      /* ─────────────── Служебное ─────────────── */

      resetToSeed: () => set({ ...INITIAL }),
    }),
    {
      name: 'qazexpopass-store',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      /**
       * Миграция сохранённого состояния.
       *
       * Прототип живёт в браузере, поэтому у тестировщика уже накоплены
       * заявки и учётные записи предыдущих версий. Пересобирать их вручную
       * (очищая localStorage) — терять демонстрационные данные, поэтому
       * состояние доводится до текущей модели на месте.
       */
      migrate: (persisted, version) => {
        const state = persisted as Partial<AppState> | undefined
        if (!state) return persisted as AppState

        if (version < 2) {
          // Фотографии раньше хранились именами файлов, теперь это объекты
          // с миниатюрой. Строки превращаем в записи без превью.
          state.applications = (state.applications ?? []).map((app) => ({
            ...app,
            items: (app.items ?? []).map((item) => ({
              ...item,
              photos: (item.photos ?? []).map((photo: unknown, index: number) =>
                typeof photo === 'string'
                  ? { id: `${item.id}-ph-${index}`, name: photo, size: 0, dataUrl: '' }
                  : photo,
              ) as typeof item.photos,
            })),
          }))

          // Учётные записи, добавленные в справочник позже, подмешиваем
          // к сохранённым: иначе новая роль просто не с кем демонстрируется.
          const known = new Set((state.users ?? []).map((u) => u.id))
          state.users = [...(state.users ?? []), ...SEED_USERS.filter((u) => !known.has(u.id))]

          state.notifications = state.notifications ?? []
          state.profileChangeRequests = state.profileChangeRequests ?? []
        }

        return state as AppState
      },
      // Тема применяется к <html> до гидратации отдельным скриптом,
      // здесь достаточно сохранить выбор пользователя
      partialize: (state) => ({
        users: state.users,
        objects: state.objects,
        applications: state.applications,
        notifications: state.notifications,
        profileChangeRequests: state.profileChangeRequests,
        currentUserId: state.currentUserId,
        activeRole: state.activeRole,
        language: state.language,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
)

/* ─────────────── Селекторы ─────────────── */

export function useCurrentUser() {
  return useAppStore((s) => (s.currentUserId ? s.users.find((u) => u.id === s.currentUserId) ?? null : null))
}

/** Заявки, доступные роли: пользователь видит только свои */
export function selectApplicationsForUser(applications: Application[], user: User | null, role: Role | null) {
  if (!user) return []
  if (role === 'user') return applications.filter((a) => a.applicantId === user.id)
  if (role === 'object_admin') return applications.filter((a) => user.objectIds.includes(a.objectId))
  return applications
}

/** Очередь администратора объекта: заявки на его объектах, ждущие решения */
export function selectObjectAdminQueue(applications: Application[], user: User | null) {
  if (!user) return []
  return applications.filter(
    (a) => a.status === 'pending_object_admin' && user.objectIds.includes(a.objectId),
  )
}

/** Очередь ГОЦ: согласованные заявки, ожидающие финальной регистрации */
export function selectGocQueue(applications: Application[]) {
  return applications.filter((a) => a.status === 'pending_goc' || a.status === 'approved')
}

/** Очередь регистраций: ждут решения администратора либо уточнения от пользователя */
export function selectRegistrationQueue(users: User[]) {
  return users.filter(
    (u) =>
      u.accountStatus === 'pending_admin_confirmation' ||
      u.accountStatus === 'needs_clarification',
  )
}

/** Непрочитанные уведомления текущего пользователя */
export function useUnreadNotifications() {
  return useAppStore((s) =>
    s.notifications.filter((n) => n.userId === s.currentUserId && !n.read),
  )
}
