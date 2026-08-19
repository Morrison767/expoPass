import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { BrandLock, BrandMark } from '@/components/layout/brand'
import { HeroPanel } from '@/components/ui/card'

/**
 * ПУБЛИЧНАЯ СТРАНИЦА СЕРВИСА.
 * Доступна всем; создание заявок и доступ к персональным данным —
 * только после авторизации и подтверждения учётной записи (п. 1 ТЗ).
 */

const STEPS = [
  {
    icon: 'file-text',
    title: 'Заявка',
    text: 'Заявитель заполняет форму: операция, объект, основание, таблица ТМЦ и одна дата.',
  },
  {
    icon: 'pen',
    title: 'Подтверждение',
    text: 'Резидент РК подписывает заявку ЭЦП, нерезидент прикладывает копию паспорта.',
  },
  {
    icon: 'clock',
    title: 'Согласование',
    text: 'Администратор выбранного объекта согласовывает, возвращает или отклоняет заявку.',
  },
  {
    icon: 'stamp',
    title: 'Регистрация',
    text: 'Главный оперативный центр присваивает номер: PDF с QR-кодом уходит заявителю на e-mail.',
  },
]

const FACTS = [
  { value: '25', label: 'объектов комплекса', hint: 'Павильоны, Конгресс-центр, Alem.AI' },
  { value: '1', label: 'дата действия', hint: 'Пропуск строго на одну календарную дату' },
  { value: '3', label: 'языка интерфейса', hint: 'Казахский, русский, английский' },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Шапка публичной части */}
      <header className="on-nav relative z-dropdown flex h-topbar shrink-0 items-center justify-between gap-3 border-b border-nav-line bg-nav px-4 sm:px-6">
        <span aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative">
          <BrandLock size={30} onDark />
        </div>
        <div className="relative flex items-center gap-2">
          <span className="hidden font-mono text-2xs font-semibold text-nav-faint sm:inline">
            KZ / RU / EN
          </span>
          <Button variant="ghost-nav" size="md" asChild>
            <Link href="/register">Регистрация</Link>
          </Button>
          <Button variant="primary-nav" size="md" asChild>
            <Link href="/login">Войти</Link>
          </Button>
        </div>
        <span aria-hidden="true" className="beam-edge absolute inset-x-0 bottom-0" />
      </header>

      <main className="flex-1">
        {/* Первый экран */}
        <HeroPanel className="border-t-0">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-2xs font-semibold uppercase tracking-label text-accent-fg">
              АО «НК «QazExpoCongress»
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-content sm:text-4xl">
              QazExpoPass — электронное оформление пропусков на территорию комплекса
            </h1>
            <p className="mt-4 max-w-2xl text-md leading-relaxed text-content-muted">
              Сервис переводит пропускные и разрешительные процессы Общества в единый электронный
              канал. На первом этапе доступен материальный пропуск на внос и вынос
              товарно-материальных ценностей: заявка проходит согласование администратором объекта и
              регистрацию Главным оперативным центром, а итоговый документ формируется в PDF
              с QR-кодом для проверки.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <Button variant="primary" size="lg" iconLeft="log-out" asChild>
                <Link href="/login">Войти в личный кабинет</Link>
              </Button>
              <Button variant="secondary" size="lg" iconLeft="user" asChild>
                <Link href="/register">Зарегистрироваться</Link>
              </Button>
              <Button variant="secondary" size="lg" iconLeft="qr" asChild>
                <Link href="/verify">Проверить пропуск по QR</Link>
              </Button>
            </div>

            <p className="mt-4 flex items-start gap-1.5 text-xs text-content-faint">
              <Icon name="info" size={13} className="mt-0.5 shrink-0" />
              <span>
                Создание заявок доступно после регистрации и подтверждения учётной записи
                администратором. Регистрация занимает несколько минут.
              </span>
            </p>
          </div>
        </HeroPanel>

        {/* Как это работает */}
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <h2 className="text-xl font-semibold text-content">Как оформляется материальный пропуск</h2>
          <p className="mt-1 text-base text-content-subtle">
            Четыре шага от заполнения формы до готового документа
          </p>

          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="relative overflow-hidden rounded-md border border-hairline bg-surface p-4 shadow-card"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-accent-line bg-accent-soft text-accent-fg">
                    <Icon name={step.icon} size={14} />
                  </span>
                  <span className="font-mono text-2xs font-semibold uppercase tracking-plate text-content-faint">
                    Шаг {index + 1}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-content">{step.title}</h3>
                <p className="mt-1.5 text-base leading-relaxed text-content-subtle">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Сводные факты */}
        <section className="border-y border-hairline bg-surface">
          <div className="mx-auto grid max-w-5xl gap-px bg-hairline px-0 sm:grid-cols-3">
            {FACTS.map((fact) => (
              <div key={fact.label} className="bg-surface px-4 py-7 sm:px-6">
                <p className="text-5xl font-semibold tabular-nums leading-none text-content">
                  {fact.value}
                </p>
                <p className="mt-2 text-2xs font-semibold uppercase tracking-label text-content-subtle">
                  {fact.label}
                </p>
                <p className="mt-1 text-xs text-content-faint">{fact.hint}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Предстоящие этапы */}
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <h2 className="text-xl font-semibold text-content">Развитие сервиса</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              {
                stage: 'Этап 1',
                title: 'Материальный пропуск',
                text: 'Внос и вынос ТМЦ. Доступен в прототипе.',
                current: true,
              },
              {
                stage: 'Этап 2',
                title: 'Наряд-допуск',
                text: 'Производство работ, состав бригады, документы по охране труда.',
                current: false,
              },
              {
                stage: 'Этап 3',
                title: 'Гостевой пропуск',
                text: 'Посетители, цель визита, проверка через ГБД ФЛ.',
                current: false,
              },
            ].map((stage) => (
              <div
                key={stage.stage}
                className={cnStage(stage.current)}
              >
                <span className="font-mono text-2xs font-semibold uppercase tracking-plate text-content-faint">
                  {stage.stage}
                </span>
                <h3 className="mt-2 text-md font-semibold text-content">{stage.title}</h3>
                <p className="mt-1 text-base text-content-subtle">{stage.text}</p>
                {stage.current ? (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded border border-status-confirmed-border bg-status-confirmed-soft px-2 py-0.5 text-2xs font-medium text-status-confirmed-text">
                    <Icon name="check" size={10} strokeWidth={2.2} />
                    Реализуется сейчас
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Подвал */}
      <footer className="border-t border-hairline bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <div className="flex items-center gap-2.5">
            <BrandMark size={28} />
            <div>
              <p className="text-base font-medium text-content">QazExpoPass</p>
              <p className="text-xs text-content-faint">АО «НК «QazExpoCongress», Астана</p>
            </div>
          </div>
          <p className="text-xs text-content-faint">
            Прототип · Этап 1 · Данные демонстрационные
          </p>
        </div>
      </footer>
    </div>
  )
}

function cnStage(current: boolean) {
  return [
    'rounded-md border p-4 shadow-card',
    current
      ? 'border-accent-line bg-accent-soft/40'
      : 'border-hairline bg-surface',
  ].join(' ')
}
