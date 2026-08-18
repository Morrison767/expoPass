'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import { PageHeader, PageBody } from '@/components/layout/page-header'
import { Card, MetaGrid, MetaItem } from '@/components/ui/card'
import { AccountStatusBadge } from '@/components/ui/status'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Field } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Icon } from '@/components/ui/icon'
import { toast } from '@/components/ui/toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore, useCurrentUser, fullName } from '@/store/app-store'
import { ROLES, USER_CATEGORIES } from '@/design/statuses'
import { formatDateTime } from '@/lib/format'
import { checkPassword, formatPhoneInput, isValidName, isValidPassword, isValidPhone } from '@/lib/validation'
import type { UserCategory } from '@/lib/types'

/**
 * ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ (п. 5.3 ТЗ).
 *
 * Контактные данные — Ф.И.О. и телефон — пользователь меняет сам.
 * Категория, организация и закреплённые объекты определяют права и
 * маршруты согласования, поэтому меняются только через запрос
 * администратору: правка не применяется до его решения.
 */
export default function ProfilePage() {
  const user = useCurrentUser()
  const objects = useAppStore((s) => s.objects)
  const requests = useAppStore((s) => s.profileChangeRequests)
  const updateOwnProfile = useAppStore((s) => s.updateOwnProfile)

  const [editContacts, setEditContacts] = useState(false)
  const [changeOpen, setChangeOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

  const objectName = (id: string) => objects.find((o) => o.id === id)?.nameRu ?? id

  const myPending = useMemo(
    () => requests.filter((r) => r.userId === user?.id && r.status === 'pending'),
    [requests, user],
  )

  if (!user) return null

  return (
    <>
      <PageHeader
        icon="user-circle"
        title="Профиль"
        subtitle="Учётные данные, принадлежность к Обществу и безопасность"
        actions={<AccountStatusBadge status={user.accountStatus} size="lg" />}
      />

      <PageBody className="space-y-4">
        {/* Уже поданный запрос — чтобы пользователь не подавал второй */}
        {myPending.length ? (
          <div className="flex items-start gap-2 rounded-md border border-status-review-border bg-status-review-soft px-3 py-2.5">
            <Icon name="clock" size={15} className="mt-0.5 shrink-0 text-status-review-base" />
            <div className="min-w-0">
              <p className="text-base font-medium text-status-review-text">
                Запрос на изменение профиля рассматривается
              </p>
              <p className="mt-0.5 text-xs text-status-review-text">
                Подан {formatDateTime(myPending[0].createdAt)}. До решения администратора текущие
                сведения остаются без изменений.
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-4">
            {/* Контактные данные — редактируются самостоятельно */}
            <Card>
              <div className="flex items-center justify-between gap-2 border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
                <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
                  Контактные данные
                </h2>
                {!editContacts ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    iconLeft="pencil"
                    onClick={() => setEditContacts(true)}
                  >
                    Изменить
                  </Button>
                ) : null}
              </div>

              {editContacts ? (
                <ContactsForm
                  user={user}
                  onCancel={() => setEditContacts(false)}
                  onSave={(patch) => {
                    updateOwnProfile(user.id, patch)
                    setEditContacts(false)
                    toast.success('Профиль обновлён', 'Изменения сохранены')
                  }}
                />
              ) : (
                <div className="px-4 py-3.5">
                  <MetaGrid columns={2}>
                    <MetaItem label="Фамилия" value={user.lastName} />
                    <MetaItem label="Имя" value={user.firstName} />
                    <MetaItem label="Отчество" value={user.middleName ?? '—'} />
                    <MetaItem label="Телефон" value={user.phone} icon="phone" mono />
                    <MetaItem
                      label="Адрес электронной почты"
                      value={user.email}
                      icon="mail"
                      className="sm:col-span-2"
                    />
                  </MetaGrid>
                  <p className="mt-3 flex items-start gap-1.5 border-t border-hairline-soft pt-2.5 text-xs text-content-faint">
                    <Icon name="info" size={12} className="mt-0.5 shrink-0" />
                    Адрес электронной почты используется как логин и меняется только
                    администратором.
                  </p>
                </div>
              )}
            </Card>

            {/* Принадлежность — только через запрос */}
            <Card>
              <div className="flex items-center justify-between gap-2 border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
                <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
                  Отношение к Обществу
                </h2>
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft="refresh"
                  onClick={() => setChangeOpen(true)}
                  disabled={myPending.length > 0}
                >
                  Запросить изменение
                </Button>
              </div>
              <div className="px-4 py-3.5">
                <MetaGrid columns={2}>
                  <MetaItem
                    label="Категория пользователя"
                    value={USER_CATEGORIES[user.category].label}
                  />
                  <MetaItem label="Организация" value={user.organization ?? '—'} icon="building" />
                  <MetaItem label="Место работы / кабинет" value={user.workplace ?? '—'} />
                  <MetaItem
                    label="Резидентство"
                    value={user.isNonResident ? 'Нерезидент РК' : 'Резидент РК'}
                  />
                </MetaGrid>

                <div className="mt-3.5 border-t border-hairline-soft pt-3">
                  <p className="text-2xs font-semibold uppercase tracking-label text-content-faint">
                    Закреплённые объекты
                  </p>
                  {user.objectIds.length ? (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {user.objectIds.map((id) => (
                        <Badge key={id} tone="navy" size="md" icon="building">
                          {objectName(id)}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-base text-content-faint">Объекты не закреплены</p>
                  )}
                </div>

                <p className="mt-3 flex items-start gap-1.5 border-t border-hairline-soft pt-2.5 text-xs text-content-faint">
                  <Icon name="lock" size={12} className="mt-0.5 shrink-0" />
                  Эти сведения определяют маршрут согласования заявок, поэтому изменяются только
                  после подтверждения администратором.
                </p>
              </div>
            </Card>
          </div>

          {/* Боковая колонка */}
          <div className="space-y-3">
            {/* Роли */}
            <Card>
              <div className="border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
                <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
                  Системные роли
                </h2>
              </div>
              <ul className="divide-y divide-hairline-soft">
                {user.roles.map((role) => (
                  <li key={role} className="flex items-start gap-2.5 px-4 py-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-accent-line bg-accent-soft text-accent-fg">
                      <Icon name={ROLES[role].icon} size={14} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-base font-medium text-content">{ROLES[role].label}</p>
                      <p className="mt-0.5 text-xs leading-snug text-content-faint">
                        {ROLES[role].scope}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="border-t border-hairline-soft px-4 py-2 text-xs text-content-faint">
                Роли назначает администратор учётных записей.
              </p>
            </Card>

            {/* Безопасность */}
            <Card>
              <div className="border-b border-hairline-soft bg-surface-sunken px-4 py-2.5">
                <h2 className="text-2xs font-semibold uppercase tracking-label text-content-subtle">
                  Безопасность
                </h2>
              </div>
              <div className="space-y-2 px-4 py-3.5">
                <Button
                  variant="secondary"
                  size="md"
                  iconLeft="lock"
                  block
                  onClick={() => setPasswordOpen(true)}
                >
                  Сменить пароль
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  iconLeft="log-out"
                  block
                  onClick={() =>
                    toast.success(
                      'Активные сессии завершены',
                      'Вход выполнен заново на текущем устройстве',
                    )
                  }
                >
                  Завершить все активные сессии
                </Button>

                <dl className="space-y-1.5 border-t border-hairline-soft pt-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-content-faint">Учётная запись создана</dt>
                    <dd className="text-xs tabular-nums text-content-muted">
                      {formatDateTime(user.createdAt)}
                    </dd>
                  </div>
                  {user.consent ? (
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="text-xs text-content-faint">Согласие на обработку ПД</dt>
                      <dd className="text-xs tabular-nums text-content-muted">
                        {formatDateTime(user.consent.acceptedAt)}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            </Card>
          </div>
        </div>
      </PageBody>

      <ChangeRequestDialog
        open={changeOpen}
        onClose={() => setChangeOpen(false)}
        userId={user.id}
        current={{
          category: user.category,
          organization: user.organization,
          objectIds: user.objectIds,
        }}
      />

      <PasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} userId={user.id} />
    </>
  )
}

/* ─────────────── Форма контактных данных ─────────────── */

function ContactsForm({
  user,
  onCancel,
  onSave,
}: {
  user: import('@/lib/types').User
  onCancel: () => void
  onSave: (patch: { lastName: string; firstName: string; middleName?: string; phone: string }) => void
}) {
  const [lastName, setLastName] = useState(user.lastName)
  const [firstName, setFirstName] = useState(user.firstName)
  const [middleName, setMiddleName] = useState(user.middleName ?? '')
  const [phone, setPhone] = useState(user.phone)
  const [submitted, setSubmitted] = useState(false)

  const errors: Record<string, string> = {}
  if (!lastName.trim()) errors.lastName = 'Укажите фамилию'
  else if (!isValidName(lastName)) errors.lastName = 'Допустимы только буквы, дефис и апостроф'
  if (!firstName.trim()) errors.firstName = 'Укажите имя'
  else if (!isValidName(firstName)) errors.firstName = 'Допустимы только буквы, дефис и апостроф'
  if (middleName.trim() && !isValidName(middleName))
    errors.middleName = 'Допустимы только буквы, дефис и апостроф'
  if (!phone.trim()) errors.phone = 'Укажите телефон'
  else if (!isValidPhone(phone)) errors.phone = 'Проверьте номер: он должен содержать код страны'

  const valid = Object.keys(errors).length === 0
  const errorOf = (field: string) => (submitted ? errors[field] : undefined)

  return (
    <div className="px-4 py-3.5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Фамилия" required error={errorOf('lastName')}>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            invalid={Boolean(errorOf('lastName'))}
          />
        </Field>
        <Field label="Имя" required error={errorOf('firstName')}>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            invalid={Boolean(errorOf('firstName'))}
          />
        </Field>
        <Field label="Отчество" optional error={errorOf('middleName')}>
          <Input
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            invalid={Boolean(errorOf('middleName'))}
          />
        </Field>
        <Field label="Телефон" required error={errorOf('phone')} className="sm:col-span-2">
          <Input
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            invalid={Boolean(errorOf('phone'))}
            iconLeft="phone"
          />
        </Field>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center justify-end gap-2 border-t border-hairline-soft pt-3">
        <Button variant="ghost" size="md" onClick={onCancel}>
          Отмена
        </Button>
        <Button
          variant="primary"
          size="md"
          iconLeft="check"
          onClick={() => {
            setSubmitted(true)
            if (!valid) return
            onSave({ lastName, firstName, middleName: middleName || undefined, phone })
          }}
        >
          Сохранить
        </Button>
      </div>
    </div>
  )
}

/* ─────────────── Запрос на изменение принадлежности ─────────────── */

function ChangeRequestDialog({
  open,
  onClose,
  userId,
  current,
}: {
  open: boolean
  onClose: () => void
  userId: string
  current: { category: UserCategory; organization?: string; objectIds: string[] }
}) {
  const objects = useAppStore((s) => s.objects)
  const createRequest = useAppStore((s) => s.createProfileChangeRequest)

  const [category, setCategory] = useState<UserCategory>(current.category)
  const [organization, setOrganization] = useState(current.organization ?? '')
  const [objectIds, setObjectIds] = useState<string[]>(current.objectIds)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [initialised, setInitialised] = useState(false)

  // Сброс полей на текущие значения при каждом открытии
  if (open && !initialised) {
    setCategory(current.category)
    setOrganization(current.organization ?? '')
    setObjectIds(current.objectIds)
    setReason('')
    setReasonError('')
    setInitialised(true)
  }

  function close() {
    setInitialised(false)
    onClose()
  }

  const changed =
    category !== current.category ||
    (organization || undefined) !== current.organization ||
    objectIds.slice().sort().join() !== current.objectIds.slice().sort().join()

  function submit() {
    if (!reason.trim()) {
      setReasonError('Укажите причину изменения')
      return
    }
    createRequest(userId, { category, organization: organization || undefined, objectIds }, reason)
    close()
    toast.success(
      'Запрос отправлен администратору',
      'Сведения изменятся после подтверждения',
    )
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Запрос на изменение сведений</DialogTitle>
          <DialogDescription>
            Категория, организация и объекты изменяются только после подтверждения администратором
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3">
          <Field label="Категория пользователя">
            <Select value={category} onValueChange={(v) => setCategory(v as UserCategory)}>
              <SelectTrigger>
                <SelectValue />
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

          <Field
            label="Организация"
            hint={category === 'employee' ? 'Для сотрудника Общества не требуется' : undefined}
          >
            <Input
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              disabled={category === 'employee'}
              iconLeft="building"
              placeholder="ТОО «Название компании»"
            />
          </Field>

          <div>
            <p className="mb-1.5 text-2xs font-semibold uppercase tracking-label text-content-subtle">
              Закреплённые объекты — выбрано {objectIds.length}
            </p>
            <div className="max-h-44 overflow-y-auto rounded border border-hairline-strong">
              {objects
                .filter((o) => o.isActive)
                .map((object) => (
                  <label
                    key={object.id}
                    className="flex cursor-pointer items-center gap-2.5 border-b border-hairline-soft px-2.5 py-1.5 last:border-0 transition-colors hover:bg-surface-sunken"
                  >
                    <Checkbox
                      checked={objectIds.includes(object.id)}
                      onCheckedChange={() =>
                        setObjectIds((prev) =>
                          prev.includes(object.id)
                            ? prev.filter((o) => o !== object.id)
                            : [...prev, object.id],
                        )
                      }
                    />
                    <span className="min-w-0 flex-1 truncate text-base text-content">
                      {object.nameRu}
                    </span>
                  </label>
                ))}
            </div>
          </div>

          <Field
            label="Причина изменения"
            required
            error={reasonError}
            hint="Обоснование увидит администратор при рассмотрении"
            htmlFor="change-reason"
          >
            <Textarea
              id="change-reason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (e.target.value.trim()) setReasonError('')
              }}
              invalid={Boolean(reasonError)}
              placeholder="Например: перешёл в другую организацию, изменился павильон размещения"
            />
          </Field>

          {!changed ? (
            <p className="flex items-start gap-1.5 rounded border border-hairline bg-surface-sunken px-2.5 py-2 text-xs text-content-faint">
              <Icon name="info" size={12} className="mt-0.5 shrink-0" />
              Сведения совпадают с текущими — измените хотя бы одно поле.
            </p>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" size="md" onClick={close}>
            Отмена
          </Button>
          <Button variant="primary" size="md" iconLeft="check" disabled={!changed} onClick={submit}>
            Отправить запрос
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ─────────────── Смена пароля ─────────────── */

function PasswordDialog({
  open,
  onClose,
  userId,
}: {
  open: boolean
  onClose: () => void
  userId: string
}) {
  const changePassword = useAppStore((s) => s.changePassword)

  const [currentPassword, setCurrentPassword] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const check = checkPassword(next)
  const errors: Record<string, string> = {}
  if (!currentPassword) errors.current = 'Введите текущий пароль'
  if (!next) errors.next = 'Задайте новый пароль'
  else if (!isValidPassword(next)) errors.next = 'Минимум 8 символов, обязательны буквы и цифры'
  else if (next === currentPassword) errors.next = 'Новый пароль совпадает с текущим'
  if (!repeat) errors.repeat = 'Повторите новый пароль'
  else if (repeat !== next) errors.repeat = 'Пароли не совпадают'

  const valid = Object.keys(errors).length === 0
  const errorOf = (f: string) => (submitted ? errors[f] : undefined)

  function close() {
    setCurrentPassword('')
    setNext('')
    setRepeat('')
    setSubmitted(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Смена пароля</DialogTitle>
          <DialogDescription>
            Новый пароль начнёт действовать при следующем входе
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3">
          <Field label="Текущий пароль" required error={errorOf('current')} htmlFor="pwd-current">
            <Input
              id="pwd-current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              invalid={Boolean(errorOf('current'))}
              autoComplete="current-password"
            />
          </Field>
          <Field label="Новый пароль" required error={errorOf('next')} htmlFor="pwd-next">
            <Input
              id="pwd-next"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              invalid={Boolean(errorOf('next'))}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Повторите новый пароль" required error={errorOf('repeat')} htmlFor="pwd-repeat">
            <Input
              id="pwd-repeat"
              type="password"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              invalid={Boolean(errorOf('repeat'))}
              autoComplete="new-password"
            />
          </Field>

          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            <PasswordRule ok={check.minLength} label="Не короче 8 символов" />
            <PasswordRule ok={check.hasLetter} label="Есть буквы" />
            <PasswordRule ok={check.hasDigit} label="Есть цифры" />
          </ul>

          <p className="flex items-start gap-1.5 text-xs text-content-faint">
            <Icon name="info" size={12} className="mt-0.5 shrink-0" />
            В прототипе текущий пароль не сверяется. В промышленной версии пароли хранятся стойким
            хэшем с солью, а смена подтверждается вводом действующего пароля.
          </p>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" size="md" onClick={close}>
            Отмена
          </Button>
          <Button
            variant="primary"
            size="md"
            iconLeft="lock"
            onClick={() => {
              setSubmitted(true)
              if (!valid) return
              changePassword(userId, next)
              close()
              toast.success('Пароль изменён')
            }}
          >
            Сменить пароль
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      <span className={cn(ok ? 'text-status-confirmed-text' : 'text-content-faint')}>{label}</span>
    </li>
  )
}
