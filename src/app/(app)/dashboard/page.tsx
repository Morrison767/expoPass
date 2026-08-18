'use client'

import Link from 'next/link'
import { PageHeader, PageBody } from '@/components/layout/page-header'
import { Card, StatTile, MetaGrid, MetaItem } from '@/components/ui/card'
import { StatusBadge, AccountStatusBadge } from '@/components/ui/status'
import { Badge, Plate } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import {
  useAppStore,
  useCurrentUser,
  selectObjectAdminQueue,
  selectGocQueue,
} from '@/store/app-store'
import { ROLES, OPERATIONS, USER_CATEGORIES, ACTIVE_STATUSES } from '@/design/statuses'
import { formatDate, formatDateTime, pluralWithCount } from '@/lib/format'
import type { Application, ApplicationStatus } from '@/lib/types'

/**
 * ГЛАВНАЯ СТРАНИЦА КАБИНЕТА.
 *
 * Состав зависит от активной роли: заявитель видит свой профиль, сводку
 * по собственным заявкам и переход к оформлению пропуска; согласующие —
 * свои очереди. Все счётчики считаются из стора.
 */

/** Группы статусов для счётчиков заявителя (кликабельны — ведут в список) */
const USER_COUNTERS: Array<{
  key: string
  label: string
  statuses: ApplicationStatus[]
  icon: string
  chip: 'accent' | 'review' | 'confirmed' | 'unpaid' | 'neutral'
  hint: string
}> = [
  {
    key: 'draft',
    label: 'Черновики',
    statuses: ['draft'],
    icon: 'circle-dashed',
    chip: 'neutral',
    hint: 'Сохранены, но не отправлены',
  },
  {
    key: 'review',
    label: 'На согласовании',
    statuses: ['pending_object_admin', 'approved', 'pending_goc'],
    icon: 'clock',
    chip: 'review',
    hint: 'У администратора объекта либо в ГОЦ',
  },
  {
    key: 'registered',
    label: 'Действуют',
    statuses: ['registered'],
    icon: 'check-double',
    chip: 'confirmed',
    hint: 'Зарегистрированы, срок не истёк',
  },
  {
    key: 'returned',
    label: 'На доработке',
    statuses: ['returned'],
    icon: 'refresh',
    chip: 'unpaid',
    hint: 'Возвращены с комментарием',
  },
]

export default function DashboardPage() {
  const user = useCurrentUser()
  const activeRole = useAppStore((s) => s.activeRole)
  const applications = useAppStore((s) => s.applications)
  const objects = useAppStore((s) => s.objects)
  const users = useAppStore((s) => s.users)

  if (!user || !activeRole) return null

  const objectName = (id: string) => objects.find((o) => o.id === id)?.nameRu ?? '—'

  const myApplications = applications.filter((a) => a.applicantId === user.id)
  const returned = myApplications.filter((a) => a.status === 'returned')
  const adminQueue = selectObjectAdminQueue(applications, user)
  const gocQueue = selectGocQueue(applications)
  const pendingUsers = users.filter((u) => u.accountStatus === 'pending_admin_confirmation')

  // Заявитель — роль «Пользователь»; суперадминистратору кабинет тоже доступен
  const isApplicant = activeRole === 'user' || activeRole === 'super_admin'

  return (
    <>
      <PageHeader
        icon="dashboard"
        title={`Здравствуйте, ${user.firstName}`}
        subtitle={
          <span className="flex flex-wrap items-center gap-1.5">
            <span>Вы работаете в роли</span>
            <Badge tone="navy" size="sm" icon={ROLES[activeRole].icon}>
              {ROLES[activeRole].label}
            </Badge>
          </span>
        }
        actions={
          isApplicant ? (
            <Button variant="primary" size="lg" iconLeft="plus" asChild>
              <Link href="/applications/new">Оформить материальный пропуск</Link>
            </Button>
          ) : null
        }
      />

      <PageBody className="space-y-5">
        {/* Возвращённые заявки требуют действия — выносим наверх */}
        {isApplicant && returned.length ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-status-unpaid-border bg-status-unpaid-soft px-3.5 py-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <Icon name="refresh" size={16} className="mt-0.5 shrink-0 text-status-unpaid-base" />
              <div className="min-w-0">
                <p className="text-md font-semibold text-status-unpaid-text">
                  {pluralWithCount(returned.length, ['заявка', 'заявки', 'заявок'])} возвращено на
                  доработку
                </p>
                <p className="mt-0.5 text-base text-status-unpaid-text">
                  {returned.length === 1 && returned[0].decisionComment
                    ? returned[0].decisionComment
                    : 'Внесите исправления по комментарию согласующего и отправьте заявку повторно.'}
                </p>
              </div>
            </div>
            <Button variant="primary" size="md" iconRight="arrow-right" asChild>
              <Link href="/applications?status=returned">Перейти к заявкам</Link>
            </Button>
          </div>
        ) : null}

        {/* ─────────── Кабинет заявителя ─────────── */}
        {isApplicant ? (
          <>
            {/* Краткий профиль */}
            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <Card>
                <div className="flex items-center justify-between gap-2 border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
                  <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
                    Профиль
                  </h2>
                  <Button variant="ghost" size="sm" iconRight="arrow-right" asChild>
                    <Link href="/profile">Открыть профиль</Link>
                  </Button>
                </div>
                <div className="px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-accent-line bg-accent-soft text-accent-fg">
                      <Icon name="user" size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-lg font-semibold leading-tight text-content">
                          {[user.lastName, user.firstName, user.middleName]
                            .filter(Boolean)
                            .join(' ')}
                        </p>
                        <AccountStatusBadge status={user.accountStatus} size="sm" />
                        {user.isNonResident ? (
                          <Badge tone="signal" size="sm" icon="id-card">
                            Нерезидент РК
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-content-faint">{user.email}</p>
                    </div>
                  </div>

                  <MetaGrid columns={3} className="mt-3.5 border-t border-hairline-soft pt-3">
                    <MetaItem
                      label="Категория"
                      value={USER_CATEGORIES[user.category].label}
                    />
                    <MetaItem label="Организация" value={user.organization ?? '—'} icon="building" />
                    <MetaItem label="Телефон" value={user.phone} icon="phone" />
                  </MetaGrid>

                  {user.objectIds.length ? (
                    <div className="mt-3 border-t border-hairline-soft pt-3">
                      <p className="text-2xs font-semibold uppercase tracking-label text-content-faint">
                        Объекты размещения
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {user.objectIds.map((id) => (
                          <Badge key={id} tone="navy" size="sm" icon="building">
                            {objectName(id)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </Card>

              {/* Крупный переход к оформлению */}
              <Card className="lg:w-72">
                <div className="flex h-full flex-col justify-between px-4 py-4">
                  <div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-md border border-accent-line bg-accent-soft text-accent-fg shadow-beam-sm">
                      <Icon name="package" size={19} />
                    </span>
                    <h2 className="mt-3 text-lg font-semibold leading-snug text-content">
                      Материальный пропуск
                    </h2>
                    <p className="mt-1 text-base leading-relaxed text-content-subtle">
                      Внос либо вынос ТМЦ на одну календарную дату. Заявка проходит согласование
                      администратором объекта и регистрацию в ГОЦ.
                    </p>
                  </div>
                  <Button variant="primary" size="lg" iconLeft="plus" block className="mt-4" asChild>
                    <Link href="/applications/new">Оформить пропуск</Link>
                  </Button>
                </div>
              </Card>
            </section>

            {/* Счётчики по статусам — кликабельные, ведут в список с фильтром */}
            <section>
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-content">Мои заявки</h2>
                <Button variant="link" size="sm" iconRight="arrow-right" asChild>
                  <Link href="/applications">Все заявки</Link>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {USER_COUNTERS.map((counter) => {
                  const count = myApplications.filter((a) =>
                    counter.statuses.includes(a.status),
                  ).length

                  return (
                    <Link
                      key={counter.key}
                      href={`/applications?status=${counter.statuses.join(',')}`}
                      className="focus-ring rounded-md"
                    >
                      <StatTile
                        label={counter.label}
                        value={count}
                        icon={counter.icon}
                        chip={counter.chip}
                        hint={counter.hint}
                        className="h-full transition-all duration-base ease-decelerate hover:-translate-y-px hover:border-hairline-strong hover:shadow-card-hover"
                      />
                    </Link>
                  )
                })}
              </div>
            </section>

            {/* Последние заявки */}
            <RecentApplications
              applications={myApplications}
              objectName={objectName}
              emptyHint="Вы ещё не создавали заявок. Начните с кнопки «Оформить пропуск»."
            />
          </>
        ) : null}

        {/* ─────────── Сводка согласующих ─────────── */}
        {activeRole === 'object_admin' ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                label="На согласовании"
                value={adminQueue.length}
                icon="clock"
                chip="review"
                hint="Ждут вашего решения"
              />
              <StatTile
                label="Мои объекты"
                value={user.objectIds.length}
                icon="building"
                hint="Закреплено за вами"
              />
              <StatTile
                label="Согласовано мной"
                value={applications.filter((a) => a.objectAdminId === user.id && a.approvedAt).length}
                icon="check"
                chip="paid"
                hint="За всё время"
              />
              <StatTile
                label="Возвращено"
                value={
                  applications.filter((a) => a.objectAdminId === user.id && a.status === 'returned')
                    .length
                }
                icon="refresh"
                chip="unpaid"
                hint="Отправлено на доработку"
              />
            </section>
            {adminQueue.length ? (
              <RecentApplications
                title="Ждут вашего согласования"
                href="/object-admin/queue"
                applications={adminQueue}
                objectName={objectName}
              />
            ) : null}
          </>
        ) : null}

        {activeRole === 'goc_officer' ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                label="На регистрации"
                value={gocQueue.length}
                icon="stamp"
                chip="paid"
                hint="Согласованы администратором объекта"
              />
              <StatTile
                label="Действуют"
                value={applications.filter((a) => a.status === 'registered').length}
                icon="check-double"
                chip="confirmed"
                hint="Зарегистрированные пропуска"
              />
              <StatTile
                label="Истекли"
                value={applications.filter((a) => a.status === 'expired').length}
                icon="calendar-x"
                chip="done"
                hint="Записи сохранены в реестре"
              />
              <StatTile
                label="Всего в реестре"
                value={applications.filter((a) => a.registrationNumber).length}
                icon="table"
                hint="Зарегистрированных документов"
              />
            </section>
            {gocQueue.length ? (
              <RecentApplications
                title="Ждут регистрации"
                href="/goc/queue"
                applications={gocQueue}
                objectName={objectName}
              />
            ) : null}
          </>
        ) : null}

        {/* Аудитор только читает: сводка по реестру без действий */}
        {activeRole === 'auditor' ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                label="Всего заявок"
                value={applications.length}
                icon="file-text"
                hint="По всем пользователям"
              />
              <StatTile
                label="В реестре"
                value={applications.filter((a) => a.registrationNumber).length}
                icon="table"
                chip="confirmed"
                hint="Зарегистрированных документов"
              />
              <StatTile
                label="Возвраты и отказы"
                value={
                  applications.filter((a) => a.status === 'returned' || a.status === 'rejected')
                    .length
                }
                icon="refresh"
                chip="unpaid"
                hint="Показатель качества подачи"
              />
              <StatTile
                label="Аннулировано"
                value={applications.filter((a) => a.status === 'cancelled').length}
                icon="ban"
                chip="neutral"
                hint="Отменено уполномоченным лицом"
              />
            </section>

            <section className="rounded-md border border-hairline bg-surface p-4 shadow-card">
              <h2 className="flex items-center gap-2 text-md font-semibold text-content">
                <Icon name="eye" size={15} className="text-accent-fg" />
                Режим просмотра
              </h2>
              <p className="mt-1.5 text-base leading-relaxed text-content-subtle">
                Роль «Аудитор» даёт чтение реестра и истории заявок без права принимать решения:
                согласование, регистрация и аннулирование недоступны.
              </p>
              <Button variant="primary" size="md" iconRight="arrow-right" className="mt-3" asChild>
                <Link href="/registry">Открыть реестр</Link>
              </Button>
            </section>
          </>
        ) : null}

        {activeRole === 'account_admin' ? (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Ожидают подтверждения"
              value={pendingUsers.length}
              icon="clock"
              chip="review"
              hint="Новые регистрации"
            />
            <StatTile label="Всего пользователей" value={users.length} icon="users" />
            <StatTile
              label="Активных"
              value={users.filter((u) => u.accountStatus === 'active').length}
              icon="check"
              chip="confirmed"
            />
            <StatTile
              label="Объектов"
              value={objects.filter((o) => o.isActive).length}
              icon="building"
              hint="Активны в справочнике"
            />
          </section>
        ) : null}

        {/* Памятка по процессу */}
        <section className="rounded-md border border-hairline bg-surface p-4 shadow-card">
          <h2 className="flex items-center gap-2 text-md font-semibold text-content">
            <Icon name="info" size={15} className="text-accent-fg" />
            Правила материального пропуска
          </h2>
          <ul className="mt-2.5 grid gap-1.5 text-base text-content-subtle sm:grid-cols-2">
            {[
              'Одна заявка — одна операция: внос либо вынос.',
              'Пропуск действует строго в одну календарную дату.',
              'Резидент РК подписывает заявку ЭЦП до отправки.',
              'Нерезидент РК прикладывает копию паспорта, ЭЦП не требуется.',
            ].map((rule) => (
              <li key={rule} className="flex gap-1.5">
                <Icon name="check" size={13} className="mt-1 shrink-0 text-accent-fg" />
                {rule}
              </li>
            ))}
          </ul>
        </section>
      </PageBody>
    </>
  )
}

/* ─────────────── Последние заявки ─────────────── */

function RecentApplications({
  title = 'Последние заявки',
  href = '/applications',
  applications,
  objectName,
  emptyHint,
}: {
  title?: string
  href?: string
  applications: Application[]
  objectName: (id: string) => string
  emptyHint?: string
}) {
  const rows = applications.slice(0, 3)

  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-content">{title}</h2>
        <Button variant="link" size="sm" iconRight="arrow-right" asChild>
          <Link href={href}>Показать все</Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-md border border-hairline bg-surface-sunken text-content-faint">
            <Icon name="inbox" size={18} />
          </span>
          <p className="text-base text-content-faint">{emptyHint ?? 'Записей нет'}</p>
        </Card>
      ) : (
        <div className="grid gap-2.5">
          {rows.map((app) => (
            <Card key={app.id} status={app.status} interactive>
              <Link href={`/applications/view?id=${app.id}`} className="block px-4 py-3.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Plate tone={app.registrationNumber ? 'accent' : 'default'}>
                      {app.registrationNumber ?? app.applicationNumber}
                    </Plate>
                    <StatusBadge status={app.status} size="sm" short />
                    <Badge tone="outline" size="sm" icon={OPERATIONS[app.operation].icon}>
                      {OPERATIONS[app.operation].label}
                    </Badge>
                  </div>
                  <span className="shrink-0 text-xs text-content-faint">
                    {formatDateTime(app.updatedAt)}
                  </span>
                </div>

                <MetaGrid columns={4} className="mt-3">
                  <MetaItem label="Объект" value={objectName(app.objectId)} icon="building" />
                  <MetaItem label="Дата действия" value={formatDate(app.validDate)} icon="calendar" />
                  <MetaItem label="Позиций ТМЦ" value={app.items.length} icon="package" />
                  <MetaItem label="Заявитель" value={app.applicantName} />
                </MetaGrid>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
