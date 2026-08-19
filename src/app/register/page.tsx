'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { BrandLock } from '@/components/layout/brand'
import { USER_CATEGORIES } from '@/design/statuses'
import { useAppStore } from '@/store/app-store'
import {
  CONSENT_TEXT,
  CONSENT_VERSION,
  checkPassword,
  formatPhoneInput,
  isValidEmail,
  isValidName,
  isValidPassword,
  isValidPhone,
} from '@/lib/validation'
import type { UserCategory } from '@/lib/types'

/**
 * РЕГИСТРАЦИЯ (п. 5.1–5.2 ТЗ).
 *
 * Два шага в одном маршруте: заполнение формы → подтверждение владения
 * почтой кодом. Учётная запись создаётся только после верного кода и
 * получает статус «Ожидает подтверждения администратором».
 *
 * Ф.И.О. разнесено на три поля — Фамилия / Имя / Отчество: так данные
 * пригодны для реестров и документов без разбора строки.
 */

/** Демонстрационный код подтверждения — реальной отправки писем нет */
const DEMO_CODE = '123456'

type Step = 'form' | 'code'

export default function RegisterPage() {
  const router = useRouter()
  const objects = useAppStore((s) => s.objects)
  const isEmailTaken = useAppStore((s) => s.isEmailTaken)
  const registerUser = useAppStore((s) => s.registerUser)

  const [step, setStep] = useState<Step>('form')
  const [submitted, setSubmitted] = useState(false)

  /* ── Поля формы ── */
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [category, setCategory] = useState<UserCategory | ''>('')
  const [organization, setOrganization] = useState('')
  const [objectIds, setObjectIds] = useState<string[]>([])
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [isNonResident, setIsNonResident] = useState(false)
  const [consent, setConsent] = useState(false)
  const [consentOpen, setConsentOpen] = useState(false)

  /* ── Шаг подтверждения почты ── */
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')

  const activeObjects = useMemo(() => objects.filter((o) => o.isActive), [objects])

  /**
   * Организация обязательна для арендатора, контрагента, подрядчика.
   * Для «иного пользователя» поле показываем, но обязательным не делаем:
   * по п. 4.1 ТЗ организация указывается, «если применимо».
   */
  const showOrganization = category !== '' && category !== 'employee'
  const organizationRequired =
    category === 'tenant' || category === 'counterparty' || category === 'contractor'

  /** Объект размещения обязателен только для арендатора (п. 5.1 ТЗ) */
  const showObjects = category === 'tenant'
  const objectsRequired = category === 'tenant'

  const passwordCheck = checkPassword(password)

  /* ── Валидация ── */
  const errors = useMemo(() => {
    const e: Record<string, string> = {}

    if (!lastName.trim()) e.lastName = 'Укажите фамилию'
    else if (!isValidName(lastName)) e.lastName = 'Допустимы только буквы, дефис и апостроф'

    if (!firstName.trim()) e.firstName = 'Укажите имя'
    else if (!isValidName(firstName)) e.firstName = 'Допустимы только буквы, дефис и апостроф'

    if (middleName.trim() && !isValidName(middleName))
      e.middleName = 'Допустимы только буквы, дефис и апостроф'

    if (!email.trim()) e.email = 'Укажите адрес электронной почты'
    else if (!isValidEmail(email)) e.email = 'Проверьте формат адреса: например, name@company.kz'
    else if (isEmailTaken(email)) e.email = 'Учётная запись с таким адресом уже зарегистрирована'

    if (!phone.trim()) e.phone = 'Укажите номер телефона'
    else if (!isValidPhone(phone)) e.phone = 'Проверьте номер: он должен содержать код страны'

    if (!category) e.category = 'Выберите категорию пользователя'

    if (organizationRequired && !organization.trim())
      e.organization = 'Для выбранной категории организация обязательна'

    if (objectsRequired && objectIds.length === 0)
      e.objectIds = 'Арендатор указывает объект, павильон или блок размещения'

    if (!password) e.password = 'Задайте пароль'
    else if (!isValidPassword(password))
      e.password = 'Минимум 8 символов, обязательны буквы и цифры'

    if (!passwordRepeat) e.passwordRepeat = 'Повторите пароль'
    else if (password !== passwordRepeat) e.passwordRepeat = 'Пароли не совпадают'

    if (!consent) e.consent = 'Согласие на обработку персональных данных обязательно'

    return e
  }, [
    lastName,
    firstName,
    middleName,
    email,
    phone,
    category,
    organization,
    organizationRequired,
    objectIds,
    objectsRequired,
    password,
    passwordRepeat,
    consent,
    isEmailTaken,
  ])

  const isValid = Object.keys(errors).length === 0

  /** Показываем ошибку поля после первой попытки отправки либо после ухода с поля */
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const errorOf = (field: string) =>
    submitted || touched[field] ? errors[field] : undefined
  const touch = (field: string) => () => setTouched((prev) => ({ ...prev, [field]: true }))

  function goToCodeStep() {
    setSubmitted(true)
    if (!isValid) return
    setStep('code')
  }

  function confirmCode() {
    if (code.trim() !== DEMO_CODE) {
      setCodeError('Неверный код. Демонстрационный код — 123456')
      return
    }

    registerUser({
      lastName,
      firstName,
      middleName: middleName || undefined,
      email,
      phone,
      category: category as UserCategory,
      organization: showOrganization ? organization : undefined,
      objectIds: showObjects ? objectIds : [],
      password,
      isNonResident,
    })

    router.push('/register/pending')
  }

  function toggleObject(id: string) {
    setObjectIds((prev) => (prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]))
    setTouched((prev) => ({ ...prev, objectIds: true }))
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="on-nav relative flex h-topbar shrink-0 items-center justify-between gap-3 border-b border-nav-line bg-nav px-4 sm:px-6">
        <span aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
        <Link href="/" className="focus-ring-nav relative rounded">
          <BrandLock size={30} onDark subtitle="Регистрация" />
        </Link>
        <Link
          href="/login"
          className="focus-ring-nav relative text-xs text-nav-subtle transition-colors hover:text-nav-fg"
        >
          Уже зарегистрированы? Войти
        </Link>
        <span aria-hidden="true" className="beam-edge absolute inset-x-0 bottom-0" />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {/* Индикатор шагов — тот же вид, что в мастере оформления пропуска */}
        <nav aria-label="Шаги регистрации" className="mb-6">
          <ol className="flex overflow-hidden rounded-md border border-hairline bg-surface-sunken">
            {[
              { key: 'form', short: 'Данные', label: 'Данные учётной записи' },
              { key: 'code', short: 'E-mail', label: 'Подтверждение e-mail' },
              { key: 'wait', short: 'Проверка', label: 'Подтверждение администратором' },
            ].map((s, index) => {
              const order = ['form', 'code', 'wait']
              const currentIndex = order.indexOf(step)
              const done = index < currentIndex
              const active = s.key === step

              return (
                <li
                  key={s.key}
                  className="flex min-w-0 flex-1 border-l border-hairline first:border-l-0"
                >
                  <span
                    aria-current={active ? 'step' : undefined}
                    title={s.label}
                    className={cn(
                      'flex w-full min-w-0 items-center justify-center gap-1.5 px-1.5 py-2.5 sm:gap-2 sm:px-3',
                      active
                        ? 'bg-accent text-content-inverse'
                        : done
                          ? 'text-accent-fg'
                          : 'text-content-faint',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-2xs font-bold tabular-nums',
                        active
                          ? 'bg-surface text-accent-fg'
                          : done
                            ? 'bg-status-confirmed-soft text-status-confirmed-text'
                            : 'border border-hairline-strong bg-surface',
                      )}
                    >
                      {done ? <Icon name="check" size={11} strokeWidth={2.8} /> : index + 1}
                    </span>
                    <span className="min-w-0 truncate text-2xs font-semibold sm:text-xs">
                      <span className="sm:hidden">{s.short}</span>
                      <span className="hidden sm:inline">{s.label}</span>
                    </span>
                  </span>
                </li>
              )
            })}
          </ol>
        </nav>

        {/* ─────────── Шаг 1: форма ─────────── */}
        {step === 'form' ? (
          <>
            <h1 className="text-lg font-bold tracking-tight text-content sm:text-xl">Регистрация в QazExpoPass</h1>
            <p className="mt-1.5 text-md text-content-subtle">
              После регистрации учётная запись проходит подтверждение администратором. До
              подтверждения создание заявок недоступно.
            </p>

            <div className="mt-5 space-y-4">
              {/* Личные данные */}
              <Card>
                <div className="border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
                  <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
                    Личные данные
                  </h2>
                </div>
                <div className="grid gap-3 px-4 py-3.5 sm:grid-cols-3">
                  <Field label="Фамилия" required error={errorOf('lastName')} htmlFor="last-name">
                    <Input
                      id="last-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      onBlur={touch('lastName')}
                      invalid={Boolean(errorOf('lastName'))}
                      autoComplete="family-name"
                    />
                  </Field>
                  <Field label="Имя" required error={errorOf('firstName')} htmlFor="first-name">
                    <Input
                      id="first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onBlur={touch('firstName')}
                      invalid={Boolean(errorOf('firstName'))}
                      autoComplete="given-name"
                    />
                  </Field>
                  <Field
                    label="Отчество"
                    optional
                    error={errorOf('middleName')}
                    htmlFor="middle-name"
                  >
                    <Input
                      id="middle-name"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      onBlur={touch('middleName')}
                      invalid={Boolean(errorOf('middleName'))}
                      autoComplete="additional-name"
                    />
                  </Field>
                </div>
              </Card>

              {/* Контакты */}
              <Card>
                <div className="border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
                  <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
                    Контактные данные
                  </h2>
                </div>
                <div className="grid gap-3 px-4 py-3.5 sm:grid-cols-2">
                  <Field
                    label="Адрес электронной почты"
                    required
                    error={errorOf('email')}
                    hint="Используется как логин и канал уведомлений"
                    htmlFor="email"
                  >
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={touch('email')}
                      invalid={Boolean(errorOf('email'))}
                      iconLeft="mail"
                      placeholder="name@company.kz"
                      autoComplete="email"
                    />
                  </Field>
                  <Field
                    label="Номер телефона"
                    required
                    error={errorOf('phone')}
                    hint="С кодом страны"
                    htmlFor="phone"
                  >
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                      onBlur={touch('phone')}
                      invalid={Boolean(errorOf('phone'))}
                      iconLeft="phone"
                      placeholder="+7 (700) 000-00-00"
                      autoComplete="tel"
                    />
                  </Field>
                </div>
              </Card>

              {/* Категория и принадлежность */}
              <Card>
                <div className="border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
                  <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
                    Отношение к Обществу
                  </h2>
                </div>
                <div className="space-y-3 px-4 py-3.5">
                  <Field
                    label="Категория пользователя"
                    required
                    error={errorOf('category')}
                    hint="Определяет состав обязательных полей"
                  >
                    <Select
                      value={category}
                      onValueChange={(v) => {
                        setCategory(v as UserCategory)
                        setTouched((prev) => ({ ...prev, category: true }))
                        // Смена категории меняет обязательность полей ниже
                        if (v === 'employee') {
                          setOrganization('')
                          setObjectIds([])
                        } else if (v !== 'tenant') {
                          setObjectIds([])
                        }
                      }}
                    >
                      <SelectTrigger invalid={Boolean(errorOf('category'))}>
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(USER_CATEGORIES) as UserCategory[]).map((key) => (
                          <SelectItem key={key} value={key}>
                            {USER_CATEGORIES[key].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  {/* Организация: условное поле */}
                  {showOrganization ? (
                    <Field
                      label="Организация"
                      required={organizationRequired}
                      optional={!organizationRequired}
                      error={errorOf('organization')}
                      hint={
                        organizationRequired
                          ? undefined
                          : 'Укажите, если действуете от имени организации'
                      }
                      htmlFor="organization"
                      className="animate-slide-in-up"
                    >
                      <Input
                        id="organization"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        onBlur={touch('organization')}
                        invalid={Boolean(errorOf('organization'))}
                        iconLeft="building"
                        placeholder="ТОО «Название компании»"
                        autoComplete="organization"
                      />
                    </Field>
                  ) : null}

                  {/* Объекты размещения: только для арендатора */}
                  {showObjects ? (
                    <Field
                      label="Объект, павильон или блок размещения"
                      required={objectsRequired}
                      error={errorOf('objectIds')}
                      hint="Можно выбрать несколько; закрепление подтверждает администратор"
                      className="animate-slide-in-up"
                      labelSuffix={
                        objectIds.length ? (
                          <span className="text-2xs tabular-nums text-content-faint">
                            выбрано: {objectIds.length}
                          </span>
                        ) : null
                      }
                    >
                      <div
                        className={cn(
                          'max-h-52 overflow-y-auto rounded border bg-surface',
                          errorOf('objectIds') ? 'border-status-conflict-border' : 'border-hairline-strong',
                        )}
                      >
                        {activeObjects.map((object) => (
                          <label
                            key={object.id}
                            className="flex cursor-pointer items-center gap-2.5 border-b border-hairline-soft px-2.5 py-1.5 last:border-0 transition-colors hover:bg-surface-sunken"
                          >
                            <Checkbox
                              checked={objectIds.includes(object.id)}
                              onCheckedChange={() => toggleObject(object.id)}
                            />
                            <span className="min-w-0 flex-1 truncate text-base text-content">
                              {object.nameRu}
                            </span>
                          </label>
                        ))}
                      </div>
                      {objectIds.length ? (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {objectIds.map((id) => (
                            <Badge key={id} tone="navy" size="sm" icon="building">
                              {activeObjects.find((o) => o.id === id)?.nameRu}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </Field>
                  ) : null}

                  {/* Признак нерезидента — определяет способ подтверждения заявок */}
                  <label className="flex cursor-pointer items-start gap-2.5 rounded border border-hairline bg-surface-sunken px-2.5 py-2">
                    <Checkbox
                      checked={isNonResident}
                      onCheckedChange={(v) => setIsNonResident(v === true)}
                      className="mt-0.5"
                    />
                    <span className="min-w-0">
                      <span className="block text-base font-medium text-content">
                        Я являюсь нерезидентом Республики Казахстан
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-content-faint">
                        Заявки такого пользователя подтверждаются копией паспорта, ЭЦП РК не
                        требуется. Признак можно изменить позже в профиле.
                      </span>
                    </span>
                  </label>
                </div>
              </Card>

              {/* Пароль */}
              <Card>
                <div className="border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
                  <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
                    Пароль
                  </h2>
                </div>
                <div className="grid gap-3 px-4 py-3.5 sm:grid-cols-2">
                  <Field label="Пароль" required error={errorOf('password')} htmlFor="password">
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={touch('password')}
                      invalid={Boolean(errorOf('password'))}
                      autoComplete="new-password"
                    />
                  </Field>
                  <Field
                    label="Повторите пароль"
                    required
                    error={errorOf('passwordRepeat')}
                    htmlFor="password-repeat"
                  >
                    <Input
                      id="password-repeat"
                      type="password"
                      value={passwordRepeat}
                      onChange={(e) => setPasswordRepeat(e.target.value)}
                      onBlur={touch('passwordRepeat')}
                      invalid={Boolean(errorOf('passwordRepeat'))}
                      autoComplete="new-password"
                    />
                  </Field>

                  {/* Требования к паролю: подсвечиваются по мере выполнения */}
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 sm:col-span-2">
                    <PasswordRule ok={passwordCheck.minLength} label="Не короче 8 символов" />
                    <PasswordRule ok={passwordCheck.hasLetter} label="Есть буквы" />
                    <PasswordRule ok={passwordCheck.hasDigit} label="Есть цифры" />
                  </ul>
                </div>
              </Card>

              {/* Согласие */}
              <Card className={errorOf('consent') ? 'border-status-conflict-border' : undefined}>
                <div className="px-4 py-3.5">
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <Checkbox
                      checked={consent}
                      onCheckedChange={(v) => {
                        setConsent(v === true)
                        setTouched((prev) => ({ ...prev, consent: true }))
                      }}
                      className="mt-0.5"
                    />
                    <span className="min-w-0 text-base leading-relaxed text-content">
                      Согласен на обработку персональных данных
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setConsentOpen(true)
                        }}
                        className="focus-ring ml-1.5 rounded-sm text-accent-fg underline underline-offset-2 transition-colors hover:text-accent-strong"
                      >
                        Прочитать текст согласия
                      </button>
                    </span>
                  </label>
                  {errorOf('consent') ? (
                    <p className="mt-2 flex items-start gap-1 text-xs text-status-conflict-text">
                      <Icon name="alert-circle" size={12} className="mt-px" />
                      {errorOf('consent')}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-content-faint">
                      Фиксируются дата, время и версия текста согласия — редакция {CONSENT_VERSION}
                    </p>
                  )}
                </div>
              </Card>

              {/* Сводка ошибок после попытки отправки */}
              {submitted && !isValid ? (
                <div className="rounded-md border border-status-conflict-border bg-status-conflict-soft p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-status-conflict-text">
                    <Icon name="alert-circle" size={13} />
                    Проверьте заполнение формы
                  </p>
                  <ul className="mt-1.5 space-y-0.5 text-xs text-status-conflict-text">
                    {Object.values(errors).map((message) => (
                      <li key={message}>— {message}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button variant="ghost" size="md" iconLeft="arrow-left" asChild>
                  <Link href="/">На главную</Link>
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  iconRight="arrow-right"
                  onClick={goToCodeStep}
                  disabled={!isValid}
                >
                  Зарегистрироваться
                </Button>
              </div>
            </div>
          </>
        ) : null}

        {/* ─────────── Шаг 2: код подтверждения ─────────── */}
        {step === 'code' ? (
          <div className="mx-auto max-w-md">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-accent-line bg-accent-soft text-accent-fg">
                <Icon name="mail" size={22} />
              </span>
              <h1 className="mt-3 text-lg font-bold tracking-tight text-content sm:text-xl">
                Мы отправили код подтверждения
              </h1>
              <p className="mt-1.5 text-md text-content-subtle">
                Код направлен на адрес{' '}
                <span className="font-medium text-content">{email}</span>. Введите шесть цифр,
                чтобы подтвердить владение почтой.
              </p>
            </div>

            <Card className="mt-5">
              <div className="px-4 py-4">
                <Field
                  label="Код подтверждения"
                  required
                  error={codeError}
                  htmlFor="code"
                  className="items-center"
                >
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                      setCodeError('')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmCode()
                    }}
                    invalid={Boolean(codeError)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    mono
                    size="lg"
                    className="text-center text-xl tracking-[0.4em]"
                  />
                </Field>

                <p className="mt-2 text-center text-xs text-content-faint">
                  Демо-код: 123456 — прототип работает без реальной отправки писем
                </p>

                <Button
                  variant="primary"
                  size="lg"
                  block
                  iconLeft="check"
                  className="mt-4"
                  onClick={confirmCode}
                  disabled={code.length !== 6}
                >
                  Подтвердить
                </Button>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-hairline-soft bg-surface-sunken px-4 py-2.5">
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft="arrow-left"
                  onClick={() => {
                    setStep('form')
                    setCode('')
                    setCodeError('')
                  }}
                >
                  Изменить данные
                </Button>
                <button
                  type="button"
                  onClick={() => setCodeError('')}
                  className="focus-ring rounded-sm text-xs text-accent-fg transition-colors hover:text-accent-strong"
                >
                  Отправить код повторно
                </button>
              </div>
            </Card>
          </div>
        ) : null}
      </main>

      {/* Текст согласия на обработку персональных данных */}
      <Dialog open={consentOpen} onOpenChange={setConsentOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Согласие на обработку персональных данных</DialogTitle>
            <DialogDescription>Редакция {CONSENT_VERSION}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="whitespace-pre-line text-base leading-relaxed text-content-muted">
              {CONSENT_TEXT}
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" size="md" onClick={() => setConsentOpen(false)}>
              Закрыть
            </Button>
            <Button
              variant="primary"
              size="md"
              iconLeft="check"
              onClick={() => {
                setConsent(true)
                setTouched((prev) => ({ ...prev, consent: true }))
                setConsentOpen(false)
              }}
            >
              Согласен
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-1.5 text-xs">
      <Icon
        name={ok ? 'check-circle' : 'circle'}
        size={12}
        className={ok ? 'text-status-confirmed-base' : 'text-content-faint'}
      />
      <span className={ok ? 'text-status-confirmed-text' : 'text-content-faint'}>{label}</span>
    </li>
  )
}
