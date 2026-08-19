'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/icon'
import { Button, IconButton } from '@/components/ui/button'
import { BrandLock } from './brand'
import { useOutsideClick } from '@/lib/hooks'
import { useAppStore, useCurrentUser, fullName, type Language } from '@/store/app-store'
import { ROLES } from '@/design/statuses'
import type { Role } from '@/lib/types'

/**
 * ТОПБАР — верхняя кромка каркаса.
 * Слева бренд-блок, справа инструменты и от чьего имени работаю.
 * Снизу проходит светящаяся линия: она отделяет каркас от рабочей
 * поверхности и служит главным «световым» акцентом интерфейса.
 */
export function Header() {
  const router = useRouter()
  const user = useCurrentUser()
  const activeRole = useAppStore((s) => s.activeRole)
  const setActiveRole = useAppStore((s) => s.setActiveRole)
  const logout = useAppStore((s) => s.logout)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  function handleLogout() {
    logout()
    router.push('/')
  }

  return (
    <header className="on-nav relative z-dropdown flex h-topbar shrink-0 items-center gap-3 border-b border-nav-line bg-nav px-3">
      <span aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative flex min-w-0 flex-1 items-center gap-3">
        <IconButton
          icon="panel-left"
          label="Свернуть или раскрыть навигацию"
          size="icon-sm"
          variant="ghost-nav"
          onClick={toggleSidebar}
          className="lg:hidden"
        />
        <Link href="/dashboard" className="focus-ring-nav min-w-0 rounded">
          <BrandLock size={30} onDark compact />
        </Link>
      </div>

      <div className="relative flex items-center gap-2">
        {user ? <NotificationsBell userId={user.id} /> : null}

        {/* Язык и тема — второстепенные переключатели: на узком экране
            уступают место уведомлениям, роли и выходу */}
        <span className="hidden sm:contents">
          <LanguageSwitcher />
          <ThemeToggle />
        </span>

        <span className="hidden h-5 w-px shrink-0 bg-nav-line sm:block" aria-hidden="true" />

        {user ? (
          <>
            <RoleSwitcher
              roles={user.roles}
              value={activeRole}
              onChange={(role) => {
                setActiveRole(role)
                router.push('/dashboard')
              }}
              userName={fullName(user)}
            />
            <Button variant="ghost-nav" size="sm" iconLeft="log-out" onClick={handleLogout}>
              <span className="hidden sm:inline">Выйти</span>
            </Button>
          </>
        ) : (
          <Button variant="primary-nav" size="sm" asChild>
            <Link href="/login">Войти</Link>
          </Button>
        )}
      </div>

      {/* Светящаяся кромка каркаса */}
      <span aria-hidden="true" className="beam-edge absolute inset-x-0 bottom-0" />
    </header>
  )
}

/* ─────────────── Уведомления ─────────────── */

const NOTIFICATION_ICON: Record<string, string> = {
  registration_submitted: 'user-circle',
  registration_approved: 'check-circle',
  registration_rejected: 'x-circle',
  registration_clarification: 'refresh',
  application: 'file-text',
}

/**
 * Внутрисистемные уведомления (п. 11 ТЗ). E-mail-канал в прототипе
 * не реализован, поэтому кабинет — единственный способ увидеть,
 * что решение по регистрации или заявке принято.
 */
function NotificationsBell({ userId }: { userId: string }) {
  const router = useRouter()
  const notifications = useAppStore((s) => s.notifications)
  const markAllRead = useAppStore((s) => s.markAllNotificationsRead)
  const markRead = useAppStore((s) => s.markNotificationRead)
  const [open, setOpen] = useState(false)
  const ref = useOutsideClick(() => setOpen(false), open)

  const mine = notifications
    .filter((n) => n.userId === userId)
    .slice()
    .reverse()
  const unread = mine.filter((n) => !n.read).length

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unread ? `Уведомления, непрочитанных: ${unread}` : 'Уведомления'}
        className={cn(
          'focus-ring-nav relative inline-flex h-control w-control items-center justify-center rounded border border-transparent text-nav-subtle transition-colors duration-fast hover:bg-nav-hover hover:text-nav-fg',
          open && 'bg-nav-hover text-nav-fg',
        )}
      >
        <Icon name="bell" size={15} />
        {unread > 0 ? (
          <span
            className="pointer-events-none absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-danger-500 px-1 text-2xs font-semibold leading-none tabular-nums tracking-normal text-white ring-2 ring-nav"
            style={{ boxShadow: '0 0 8px 0 rgba(239, 68, 68, 0.55)' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Уведомления"
          className="absolute right-0 top-[calc(100%+6px)] z-dropdown w-80 animate-scale-in overflow-hidden rounded-md border border-hairline bg-surface shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 border-b border-hairline-soft bg-surface-sunken px-3 py-2">
            <p className="text-2xs font-semibold uppercase tracking-label text-content-faint">
              Уведомления
            </p>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => markAllRead(userId)}
                className="focus-ring rounded-sm text-2xs text-accent-fg transition-colors hover:text-accent-strong"
              >
                Отметить прочитанными
              </button>
            ) : null}
          </div>

          {mine.length === 0 ? (
            <p className="px-3 py-6 text-center text-base text-content-faint">
              Уведомлений пока нет
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {mine.slice(0, 12).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markRead(item.id)
                      if (item.href) {
                        setOpen(false)
                        router.push(item.href)
                      }
                    }}
                    className={cn(
                      'flex w-full items-start gap-2.5 border-b border-hairline-soft px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-surface-sunken',
                      !item.read && 'bg-accent-soft/40',
                    )}
                  >
                    <Icon
                      name={NOTIFICATION_ICON[item.kind] ?? 'info'}
                      size={14}
                      className={cn('mt-0.5 shrink-0', item.read ? 'text-content-faint' : 'text-accent')}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-medium text-content">{item.title}</span>
                      {item.body ? (
                        <span className="mt-0.5 block text-xs leading-snug text-content-subtle">
                          {item.body}
                        </span>
                      ) : null}
                      <span className="mt-1 block text-2xs tabular-nums text-content-faint">
                        {new Date(item.at).toLocaleString('ru-RU')}
                      </span>
                    </span>
                    {!item.read ? (
                      <span
                        aria-hidden="true"
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                      />
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}

/* ─────────────── Переключатель роли ─────────────── */

/**
 * Один пользователь может иметь несколько ролей (п. 4 ТЗ).
 * При одной роли — статичная плашка, при нескольких — выпадающий список.
 */
function RoleSwitcher({
  roles,
  value,
  onChange,
  userName,
}: {
  roles: Role[]
  value: Role | null
  onChange: (role: Role) => void
  userName: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useOutsideClick(() => setOpen(false), open)
  const current = value ? ROLES[value] : null

  const identity = (
    <span className="hidden min-w-0 text-left md:block">
      <span className="block truncate text-xs font-medium leading-tight text-nav-fg">{userName}</span>
      <span className="block truncate text-2xs text-nav-subtle">{current?.short ?? '—'}</span>
    </span>
  )

  if (roles.length <= 1) {
    return (
      <span className="flex items-center gap-2 px-1">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent-line bg-accent-soft text-accent-fg">
          <Icon name={current?.icon ?? 'user'} size={13} />
        </span>
        {identity}
      </span>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'focus-ring-nav flex h-control items-center gap-2 rounded border border-transparent px-1.5 transition-colors duration-fast hover:bg-nav-hover',
          open && 'bg-nav-hover',
        )}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent-line bg-accent-soft text-accent-fg">
          <Icon name={current?.icon ?? 'user'} size={13} />
        </span>
        {identity}
        <Icon name="chevron-down" size={13} className="shrink-0 text-nav-faint" />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+6px)] z-dropdown w-72 animate-scale-in overflow-hidden rounded-md border border-hairline bg-surface shadow-lg"
        >
          <p className="border-b border-hairline-soft bg-surface-sunken px-3 py-2 text-2xs font-semibold uppercase tracking-label text-content-faint">
            Работать в роли
          </p>
          {roles.map((roleKey) => {
            const role = ROLES[roleKey]
            const active = roleKey === value
            return (
              <button
                key={roleKey}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(roleKey)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors duration-fast',
                  active ? 'bg-accent-soft' : 'hover:bg-surface-sunken',
                )}
              >
                <Icon
                  name={role.icon}
                  size={14}
                  className={cn('mt-0.5 shrink-0', active ? 'text-accent' : 'text-content-faint')}
                />
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block text-base font-medium',
                      active ? 'text-accent-strong' : 'text-content',
                    )}
                  >
                    {role.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-content-faint">
                    {role.scope}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

/* ─────────────── Язык интерфейса ─────────────── */

const LANGUAGES: Array<{ key: Language; label: string; short: string }> = [
  { key: 'ru', label: 'Русский', short: 'RU' },
  { key: 'kk', label: 'Қазақша', short: 'KZ' },
  { key: 'en', label: 'English', short: 'EN' },
]

/**
 * Переключатель KZ/RU/EN. На данном этапе — UI-заглушка: выбор
 * сохраняется в сторе, но переводы подключаются отдельным этапом.
 * Переключение языка не должно терять введённые данные (п. 1 ТЗ),
 * поэтому смена значения не перезагружает страницу.
 */
function LanguageSwitcher() {
  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const [open, setOpen] = useState(false)
  const ref = useOutsideClick(() => setOpen(false), open)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Язык интерфейса"
        className={cn(
          'focus-ring-nav inline-flex h-control items-center gap-1 rounded border border-transparent px-1.5 text-nav-subtle transition-colors duration-fast hover:bg-nav-hover hover:text-nav-fg',
          open && 'bg-nav-hover text-nav-fg',
        )}
      >
        <Icon name="globe" size={15} />
        <span className="font-mono text-2xs font-semibold">
          {LANGUAGES.find((l) => l.key === language)?.short}
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+6px)] z-dropdown w-44 animate-scale-in overflow-hidden rounded-md border border-hairline bg-surface shadow-lg"
        >
          {LANGUAGES.map((option) => (
            <button
              key={option.key}
              type="button"
              role="option"
              aria-selected={option.key === language}
              onClick={() => {
                setLanguage(option.key)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-base transition-colors duration-fast',
                option.key === language
                  ? 'bg-accent-soft text-accent-strong'
                  : 'text-content-muted hover:bg-surface-sunken hover:text-content',
              )}
            >
              <span>{option.label}</span>
              <span className="font-mono text-2xs text-content-faint">{option.short}</span>
            </button>
          ))}
          <p className="border-t border-hairline-soft bg-surface-sunken px-3 py-1.5 text-2xs text-content-faint">
            Переводы подключаются на отдельном этапе
          </p>
        </div>
      ) : null}
    </div>
  )
}

/* ─────────────── Тема ─────────────── */

function ThemeToggle() {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <IconButton
      icon={theme === 'dark' ? 'sun' : 'moon'}
      label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
      variant="ghost-nav"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    />
  )
}
