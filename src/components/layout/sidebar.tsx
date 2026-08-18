'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/icon'
import { Counter } from '@/components/ui/badge'
import { navForRole } from '@/design/navigation'
import { ROLES } from '@/design/statuses'
import {
  useAppStore,
  useCurrentUser,
  selectObjectAdminQueue,
  selectGocQueue,
} from '@/store/app-store'
import { ACTIVE_STATUSES } from '@/design/statuses'

/**
 * НАВИГАЦИОННЫЙ САЙДБАР — «указатель по комплексу».
 *
 * Работает на токенах каркаса (nav-*): в светлой теме белый, в тёмной —
 * обсидиановый корпус. Активный раздел маркируется светящейся кромкой —
 * тот же механизм, что у карточек и строк реестра. Группы разделов
 * подписаны CAPS-метками, как секции на схеме объекта.
 */
export function Sidebar() {
  const pathname = usePathname()
  const user = useCurrentUser()
  const activeRole = useAppStore((s) => s.activeRole)
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const applications = useAppStore((s) => s.applications)
  const users = useAppStore((s) => s.users)

  const groups = navForRole(activeRole)
  const role = activeRole ? ROLES[activeRole] : null

  /** Счётчики очередей — вычисляются из стора, а не хардкодятся */
  const counters: Record<string, number> = {
    object_admin_queue: selectObjectAdminQueue(applications, user).length,
    goc_queue: selectGocQueue(applications).length,
    my_active: applications.filter(
      (a) => a.applicantId === user?.id && ACTIVE_STATUSES.includes(a.status),
    ).length,
    pending_registrations: users.filter(
      (u) => u.accountStatus === 'pending_admin_confirmation',
    ).length,
  }

  return (
    <nav
      aria-label="Основная навигация"
      className={cn(
        'on-nav relative hidden h-full shrink-0 flex-col border-r border-nav-line bg-surface-nav transition-[width] duration-slow ease-decelerate lg:flex',
        collapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
      )}
    >
      <span aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0 opacity-50" />
      <span aria-hidden="true" className="bloom-beam pointer-events-none absolute inset-0" />

      {/* Разделы */}
      <div className="relative min-h-0 flex-1 overflow-y-auto py-3">
        {groups.map((group, groupIndex) => (
          <div key={group.key} className={cn(groupIndex > 0 && 'mt-4')}>
            {!collapsed ? (
              <p className="mb-1 px-3 text-2xs font-semibold uppercase tracking-label text-nav-subtle">
                {group.label}
              </p>
            ) : groupIndex > 0 ? (
              <div className="mx-3 mb-2 border-t border-nav-line" />
            ) : null}

            <ul className="space-y-px px-2">
              {group.items.map((item) => {
                const active = pathname === item.path || pathname.startsWith(`${item.path}/`)
                const count = item.counter ? counters[item.counter] : undefined

                return (
                  <li key={item.key}>
                    <Link
                      href={item.path}
                      aria-current={active ? 'page' : undefined}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'focus-ring-nav relative flex h-8 w-full items-center gap-2.5 rounded px-2 text-base transition-colors duration-fast',
                        collapsed && 'justify-center px-0',
                        active
                          ? 'bg-nav-active font-medium text-accent-strong'
                          : 'text-nav-muted hover:bg-nav-hover hover:text-nav-fg',
                      )}
                    >
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 h-4 w-rail rounded-r-sm bg-accent shadow-beam-sm"
                        />
                      ) : null}
                      <Icon
                        name={item.icon}
                        size={15}
                        className={cn(
                          'transition-colors duration-fast',
                          active ? 'text-accent' : 'text-nav-faint',
                        )}
                      />
                      {!collapsed ? (
                        <>
                          <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                          {count ? (
                            <Counter value={count} tone={active ? 'beam' : 'neutral'} />
                          ) : null}
                        </>
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Подвал: активная роль, свернуть, версия сборки */}
      <div className="relative shrink-0 border-t border-nav-line bg-nav-sunken">
        {!collapsed && role ? (
          <div className="flex items-center gap-2 px-3 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent-line bg-accent-soft text-accent-fg">
              <Icon name={role.icon} size={13} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-nav-fg">{role.short}</p>
              <p className="truncate text-2xs text-nav-subtle">Активная роль</p>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            'focus-ring-nav flex h-8 w-full items-center gap-2.5 px-3 text-xs text-nav-subtle transition-colors duration-fast hover:bg-nav-hover hover:text-nav-fg',
            collapsed && 'justify-center px-0',
          )}
        >
          <Icon name={collapsed ? 'chevrons-right' : 'chevrons-left'} size={14} />
          {!collapsed ? <span>Свернуть панель</span> : null}
        </button>

        {!collapsed ? (
          <div className="flex items-center gap-1.5 border-t border-nav-line px-3 py-2">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-status-confirmed-base shadow-beam-sm"
            />
            <span className="truncate text-2xs text-nav-faint">Прототип · Этап 1</span>
          </div>
        ) : null}
      </div>
    </nav>
  )
}

/**
 * Нижняя навигация для мобильных: сайдбар на узких экранах скрыт,
 * основные разделы роли остаются в пределах большого пальца.
 */
export function MobileNav() {
  const pathname = usePathname()
  const activeRole = useAppStore((s) => s.activeRole)
  const items = navForRole(activeRole).flatMap((g) => g.items)

  if (!items.length) return null

  return (
    <nav
      aria-label="Разделы"
      className="on-nav sticky bottom-0 z-sticky flex shrink-0 items-stretch gap-px overflow-x-auto border-t border-nav-line bg-surface-nav lg:hidden"
    >
      {items.map((item) => {
        const active = pathname === item.path || pathname.startsWith(`${item.path}/`)
        return (
          <Link
            key={item.key}
            href={item.path}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'focus-ring-nav relative flex min-w-[5.5rem] flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-2xs transition-colors duration-fast',
              active ? 'text-accent-strong' : 'text-nav-subtle hover:text-nav-fg',
            )}
          >
            {active ? (
              <span aria-hidden="true" className="beam-edge absolute inset-x-0 top-0" />
            ) : null}
            <Icon name={item.icon} size={16} className={active ? 'text-accent' : 'text-nav-faint'} />
            <span className="truncate text-center leading-tight">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
