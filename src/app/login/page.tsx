'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input, Field } from '@/components/ui/input'
import { AccountStatusBadge } from '@/components/ui/status'
import { BrandLock } from '@/components/layout/brand'
import { ROLES, USER_CATEGORIES, ACCOUNT_STATUSES } from '@/design/statuses'
import { useAppStore, fullName } from '@/store/app-store'
import { DEMO_PASSWORD } from '@/lib/seed'
import type { AccountStatus } from '@/lib/types'

/**
 * ВХОД В СЕРВИС.
 *
 * Два способа: обычная форма e-mail + пароль и быстрый вход по карточке
 * учётной записи — последний оставлен для демонстрации ролей.
 *
 * Пароль в прототипе по-настоящему не проверяется: достаточно любого
 * непустого значения. Реальная проверка, хэширование и двухфакторная
 * аутентификация административных ролей относятся к боевой реализации.
 */

/** Что показать, если учётная запись найдена, но войти нельзя */
interface Gate {
  status: AccountStatus
  message: string
  detail?: string
}

export default function LoginPage() {
  const router = useRouter()
  const users = useAppStore((s) => s.users)
  const login = useAppStore((s) => s.login)
  const loginByEmail = useAppStore((s) => s.loginByEmail)
  const theme = useAppStore((s) => s.theme)

  const [hydrated, setHydrated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [gate, setGate] = useState<Gate | null>(null)

  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true))
    if (useAppStore.persist.hasHydrated()) setHydrated(true)
    return unsub
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setFormError('')
    setGate(null)

    if (!email.trim()) {
      setFormError('Укажите адрес электронной почты')
      return
    }
    if (!password.trim()) {
      setFormError('Введите пароль')
      return
    }

    const result = loginByEmail(email, password)

    if (result.ok) {
      router.push('/dashboard')
      return
    }

    if (result.reason === 'not_found') {
      setFormError('Учётная запись с таким адресом не найдена')
      return
    }

    if (result.reason === 'inactive' && result.user) {
      const meta = ACCOUNT_STATUSES[result.user.accountStatus]
      // Причина отказа и комментарий уточнения показываются пользователю
      const detail =
        result.user.accountStatus === 'rejected'
          ? result.user.rejectionReason
          : result.user.accountStatus === 'needs_clarification'
            ? result.user.clarificationComment
            : undefined

      setGate({ status: result.user.accountStatus, message: meta.loginMessage, detail })
      return
    }

    setFormError('Введите пароль')
  }

  function quickLogin(userId: string) {
    login(userId)
    router.push('/dashboard')
  }

  const activeUsers = hydrated ? users.filter((u) => u.accountStatus === 'active') : []
  const otherUsers = hydrated ? users.filter((u) => u.accountStatus !== 'active') : []

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="on-nav relative flex h-topbar shrink-0 items-center justify-between gap-3 border-b border-nav-line bg-nav px-4 sm:px-6">
        <span aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
        <Link href="/" className="focus-ring-nav relative rounded">
          <BrandLock size={30} onDark />
        </Link>
        <Link
          href="/"
          className="focus-ring-nav relative inline-flex items-center gap-1.5 rounded text-xs text-nav-subtle transition-colors hover:text-nav-fg"
        >
          <Icon name="arrow-left" size={13} />
          На главную
        </Link>
        <span aria-hidden="true" className="beam-edge absolute inset-x-0 bottom-0" />
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          {/* ─────────── Форма входа ─────────── */}
          <section>
            <h1 className="text-2xl font-semibold text-content">Вход</h1>
            <p className="mt-1.5 text-base text-content-subtle">
              Адрес электронной почты используется как логин.
            </p>

            <Card className="mt-4">
              <form className="space-y-3 px-4 py-4" onSubmit={submit}>
                <Field label="Адрес электронной почты" required htmlFor="login-email">
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setFormError('')
                      setGate(null)
                    }}
                    iconLeft="mail"
                    placeholder="name@company.kz"
                    autoComplete="email"
                    invalid={Boolean(formError)}
                  />
                </Field>

                <Field label="Пароль" required htmlFor="login-password">
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setFormError('')
                    }}
                    autoComplete="current-password"
                    invalid={Boolean(formError)}
                  />
                </Field>

                {formError ? (
                  <p className="flex items-start gap-1.5 text-xs text-status-conflict-text">
                    <Icon name="alert-circle" size={12} className="mt-0.5 shrink-0" />
                    {formError}
                  </p>
                ) : null}

                {/* Учётная запись найдена, но её статус не допускает входа */}
                {gate ? <GateNotice gate={gate} /> : null}

                <Button type="submit" variant="primary" size="lg" block iconLeft="log-out">
                  Войти
                </Button>

                <p className="text-center text-xs text-content-faint">
                  Демо-пароль любой непустой, у засеянных учётных записей —{' '}
                  <span className="font-mono">{DEMO_PASSWORD}</span>
                </p>
              </form>

              <div className="border-t border-hairline-soft bg-surface-sunken px-4 py-3">
                <p className="text-base text-content-subtle">
                  Нет учётной записи?{' '}
                  <Link
                    href="/register"
                    className="focus-ring rounded-sm font-medium text-accent-fg underline underline-offset-2 hover:text-accent-strong"
                  >
                    Зарегистрироваться
                  </Link>
                </p>
              </div>
            </Card>

            {/* Подсказка: какие адреса показывают разные состояния */}
            {otherUsers.length ? (
              <div className="mt-3 rounded-md border border-hairline bg-surface p-3 shadow-card">
                <p className="text-2xs font-semibold uppercase tracking-label text-content-faint">
                  Проверить сообщения статусов
                </p>
                <ul className="mt-1.5 space-y-1">
                  {otherUsers.map((user) => (
                    <li key={user.id} className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEmail(user.email)
                          setPassword(DEMO_PASSWORD)
                          setFormError('')
                          setGate(null)
                        }}
                        className="focus-ring rounded-sm font-mono text-xs text-accent-fg underline underline-offset-2 hover:text-accent-strong"
                      >
                        {user.email}
                      </button>
                      <AccountStatusBadge status={user.accountStatus} size="sm" />
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-2xs text-content-faint">
                  Нажмите на адрес, чтобы подставить его в форму, затем «Войти».
                </p>
              </div>
            ) : null}
          </section>

          {/* ─────────── Быстрый вход ─────────── */}
          <section>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-content">Быстрый вход для демонстрации</h2>
              <span className="text-xs text-content-faint">Только активные учётные записи</span>
            </div>
            <p className="mt-1 text-base text-content-subtle">
              Нажмите карточку — прототип откроется в роли этого пользователя.
            </p>

            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {activeUsers.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => quickLogin(user.id)}
                    aria-label={`Войти как ${fullName(user)}`}
                    className={cn(
                      'focus-ring group relative flex h-full w-full flex-col overflow-hidden rounded-md border border-hairline bg-surface p-3.5 text-left shadow-card',
                      'transition-all duration-base ease-decelerate hover:border-hairline-strong',
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-accent-line bg-accent-soft text-accent-fg">
                        <Icon name={ROLES[user.roles[0]]?.icon ?? 'user'} size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-md font-semibold leading-tight text-content">
                          {fullName(user)}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-content-faint">{user.email}</p>
                      </div>
                      <Icon
                        name="arrow-right"
                        size={14}
                        className="mt-1 shrink-0 text-content-faint opacity-0 transition-opacity duration-fast group-hover:opacity-100"
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {user.roles.map((role) => (
                        <Badge key={role} tone="navy" size="sm" icon={ROLES[role].icon}>
                          {ROLES[role].short}
                        </Badge>
                      ))}
                      {user.isNonResident ? (
                        <Badge tone="signal" size="sm" icon="id-card">
                          Нерезидент РК
                        </Badge>
                      ) : null}
                    </div>

                    <dl className="mt-3 space-y-2 border-t border-hairline-soft pt-2.5 text-base">
                      <div className="min-w-0">
                        <dt className="text-2xs font-semibold uppercase tracking-label text-content-faint">
                          Категория
                        </dt>
                        <dd className="truncate text-content-muted">
                          {USER_CATEGORIES[user.category].label}
                        </dd>
                      </div>
                      {user.organization ? (
                        <div className="min-w-0">
                          <dt className="text-2xs font-semibold uppercase tracking-label text-content-faint">
                            Организация
                          </dt>
                          <dd className="truncate text-content-muted">{user.organization}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </button>
                </li>
              ))}
            </ul>

            {!hydrated ? (
              <p className="mt-4 flex items-center gap-2 text-base text-content-faint">
                <Icon name="loader" size={14} className="animate-spin" />
                Загрузка учётных записей…
              </p>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  )
}

/** Сообщение о том, почему вход невозможен при текущем статусе */
function GateNotice({ gate }: { gate: Gate }) {
  const meta = ACCOUNT_STATUSES[gate.status]

  const tone =
    gate.status === 'rejected' || gate.status === 'blocked' || gate.status === 'deactivated'
      ? 'border-status-conflict-border bg-status-conflict-soft text-status-conflict-text'
      : gate.status === 'needs_clarification'
        ? 'border-status-unpaid-border bg-status-unpaid-soft text-status-unpaid-text'
        : 'border-status-review-border bg-status-review-soft text-status-review-text'

  return (
    <div className={cn('rounded-md border px-3 py-2.5', tone)}>
      <div className="flex items-start gap-2">
        <Icon name={meta.icon} size={15} className="mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-base font-medium">{gate.message}</p>
          {gate.detail ? (
            <p className="mt-1 text-xs leading-relaxed">
              <span className="font-semibold">Причина: </span>
              {gate.detail}
            </p>
          ) : null}
          {gate.status === 'email_unconfirmed' ? (
            <Link
              href="/register"
              className="focus-ring mt-1.5 inline-block rounded-sm text-xs underline underline-offset-2"
            >
              Пройти подтверждение
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
