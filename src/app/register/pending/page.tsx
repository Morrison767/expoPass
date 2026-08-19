'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AccountStatusBadge } from '@/components/ui/status'
import { BrandLock } from '@/components/layout/brand'

/**
 * ОЖИДАНИЕ ПОДТВЕРЖДЕНИЯ АДМИНИСТРАТОРОМ (п. 5.2 ТЗ).
 *
 * Учётная запись создана, владение почтой подтверждено, но до решения
 * администратора доступ к созданию заявок закрыт.
 */

const NEXT_STEPS = [
  {
    icon: 'check-circle',
    done: true,
    title: 'Данные приняты',
    text: 'Регистрационная форма заполнена и сохранена',
  },
  {
    icon: 'check-circle',
    done: true,
    title: 'E-mail подтверждён',
    text: 'Владение почтовым адресом подтверждено кодом',
  },
  {
    icon: 'clock',
    done: false,
    title: 'Проверка администратором',
    text: 'Администратор учётных записей проверяет сведения, назначает роли и объекты',
  },
  {
    icon: 'mail',
    done: false,
    title: 'Уведомление о решении',
    text: 'Результат придёт на указанный адрес электронной почты',
  },
]

export default function RegisterPendingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="on-nav relative flex h-topbar shrink-0 items-center justify-between gap-3 border-b border-nav-line bg-nav px-4 sm:px-6">
        <span aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
        <Link href="/" className="focus-ring-nav relative rounded">
          <BrandLock size={30} onDark subtitle="Регистрация" />
        </Link>
        <span aria-hidden="true" className="beam-edge absolute inset-x-0 bottom-0" />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-status-review-border bg-status-review-soft text-status-review-text shadow-bevel">
            <Icon name="clock" size={26} />
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-content">
            Учётная запись создана
          </h1>
          <div className="mt-2.5">
            <AccountStatusBadge status="pending_admin_confirmation" size="lg" />
          </div>
          <p className="mt-3 max-w-lg text-md leading-relaxed text-content-subtle">
            Ваша регистрация принята и передана администратору учётных записей. До подтверждения
            создание заявок и доступ к персональным данным закрыты — это требование порядка
            пропускного режима Общества.
          </p>
        </div>

        <Card className="mt-6">
          <div className="border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
            <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
              Что происходит дальше
            </h2>
          </div>
          <ol className="px-4 py-3.5">
            {NEXT_STEPS.map((step, index) => (
              <li key={step.title} className="relative flex gap-3 pb-4 last:pb-0">
                {index < NEXT_STEPS.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-[11px] top-6 h-full w-px bg-hairline"
                  />
                ) : null}
                <span
                  className={
                    step.done
                      ? 'relative z-base flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-status-confirmed-border bg-status-confirmed-soft text-status-confirmed-base'
                      : 'relative z-base flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-hairline bg-surface text-content-faint'
                  }
                >
                  <Icon name={step.icon} size={11} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-base font-medium text-content">{step.title}</p>
                  <p className="mt-0.5 text-xs leading-snug text-content-subtle">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button variant="primary" size="lg" iconLeft="log-out" asChild>
            <Link href="/login">Войти позже</Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/">На главную</Link>
          </Button>
        </div>

        <p className="mt-4 flex items-start justify-center gap-1.5 text-center text-xs text-content-faint">
          <Icon name="info" size={12} className="mt-0.5 shrink-0" />
          <span>
            Прототип: чтобы подтвердить эту заявку, войдите администратором и откройте раздел
            «Регистрации».
          </span>
        </p>
      </main>
    </div>
  )
}
