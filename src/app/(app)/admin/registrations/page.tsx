'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import { PageHeader, PageBody } from '@/components/layout/page-header'
import {
  TableWrap,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AccountStatusBadge } from '@/components/ui/status'
import { Badge, Counter, Plate } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Field } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Icon } from '@/components/ui/icon'
import { StatTile } from '@/components/ui/card'
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
import { useAppStore, fullName } from '@/store/app-store'
import { ROLES, USER_CATEGORIES, ACCOUNT_STATUSES } from '@/design/statuses'
import { formatDateTime } from '@/lib/format'
import type { Role, SiteObject, User, UserCategory } from '@/lib/types'

/**
 * ОЧЕРЕДЬ РЕГИСТРАЦИЙ (п. 5.2 и п. 6 ТЗ).
 *
 * Администратор учётных записей рассматривает поданные регистрации:
 * подтверждает, отклоняет с причиной либо возвращает на уточнение
 * с комментарием. Перед подтверждением можно поправить категорию,
 * организацию и закреплённые объекты, а также назначить роли.
 */
export default function RegistrationsPage() {
  const users = useAppStore((s) => s.users)
  const objects = useAppStore((s) => s.objects)

  const [selected, setSelected] = useState<User | null>(null)

  const pending = useMemo(
    () => users.filter((u) => u.accountStatus === 'pending_admin_confirmation'),
    [users],
  )
  const clarification = useMemo(
    () => users.filter((u) => u.accountStatus === 'needs_clarification'),
    [users],
  )
  const reviewedToday = useMemo(
    () =>
      users.filter(
        (u) => u.reviewedAt && (u.accountStatus === 'active' || u.accountStatus === 'rejected'),
      ),
    [users],
  )

  return (
    <>
      <PageHeader
        icon="user-circle"
        title="Очередь регистраций"
        subtitle="Рассмотрение самостоятельно поданных регистраций: подтверждение, отклонение, уточнение"
      />

      <PageBody className="space-y-4">
        <section className="grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Ждут решения"
            value={pending.length}
            icon="clock"
            chip="review"
            hint="Подтверждён e-mail, требуется решение администратора"
          />
          <StatTile
            label="На уточнении"
            value={clarification.length}
            icon="refresh"
            chip="unpaid"
            hint="Ожидается ответ пользователя"
          />
          <StatTile
            label="Рассмотрено"
            value={reviewedToday.length}
            icon="check-double"
            chip="confirmed"
            hint="Подтверждено либо отклонено"
          />
        </section>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Ожидают подтверждения
              {pending.length ? <Counter value={pending.length} tone="beam" /> : null}
            </TabsTrigger>
            <TabsTrigger value="clarification">
              На уточнении
              {clarification.length ? <Counter value={clarification.length} /> : null}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <RegistrationTable
              rows={pending}
              objects={objects}
              onSelect={setSelected}
              emptyTitle="Новых регистраций нет"
              emptyHint="Все поданные заявки на регистрацию рассмотрены."
            />
          </TabsContent>

          <TabsContent value="clarification" className="mt-4">
            <RegistrationTable
              rows={clarification}
              objects={objects}
              onSelect={setSelected}
              emptyTitle="Нет записей на уточнении"
              emptyHint="Никому из пользователей не направлен запрос на уточнение сведений."
              showComment
            />
          </TabsContent>
        </Tabs>
      </PageBody>

      <ReviewDialog user={selected} objects={objects} onClose={() => setSelected(null)} />
    </>
  )
}

/* ─────────────── Таблица очереди ─────────────── */

function RegistrationTable({
  rows,
  objects,
  onSelect,
  emptyTitle,
  emptyHint,
  showComment = false,
}: {
  rows: User[]
  objects: SiteObject[]
  onSelect: (user: User) => void
  emptyTitle: string
  emptyHint: string
  showComment?: boolean
}) {
  const objectName = (id: string) => objects.find((o) => o.id === id)?.nameRu ?? id

  return (
    <TableWrap>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Пользователь</TableHead>
            <TableHead>Контакты</TableHead>
            <TableHead>Категория</TableHead>
            <TableHead>Организация</TableHead>
            <TableHead>Объекты</TableHead>
            <TableHead>Подана</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="w-9" aria-label="Действия" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmpty colSpan={8} icon="user-circle" title={emptyTitle} hint={emptyHint} />
          ) : (
            rows.map((user) => (
              <TableRow key={user.id} interactive onClick={() => onSelect(user)}>
                <TableCell>
                  <span className="block max-w-[14rem] truncate font-medium text-content">
                    {fullName(user)}
                  </span>
                  {user.isNonResident ? (
                    <span className="text-2xs text-signal-700">Нерезидент РК</span>
                  ) : null}
                  {showComment && user.clarificationComment ? (
                    <span className="mt-0.5 block max-w-[18rem] truncate text-2xs text-status-unpaid-text">
                      {user.clarificationComment}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell>
                  <span className="block max-w-[13rem] truncate">{user.email}</span>
                  <span className="block text-2xs tabular-nums text-content-faint">
                    {user.phone}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="block max-w-[11rem] truncate">
                    {USER_CATEGORIES[user.category].label}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="block max-w-[12rem] truncate">{user.organization ?? '—'}</span>
                </TableCell>
                <TableCell>
                  {user.objectIds.length ? (
                    <span className="block max-w-[11rem] truncate">
                      {user.objectIds.map(objectName).join(', ')}
                    </span>
                  ) : (
                    <span className="text-content-faint">—</span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm tabular-nums">
                  {formatDateTime(user.createdAt)}
                </TableCell>
                <TableCell>
                  <AccountStatusBadge status={user.accountStatus} size="sm" />
                </TableCell>
                <TableCell className="w-9 px-2">
                  <Icon name="chevron-right" size={14} className="text-content-faint" />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableWrap>
  )
}

/* ─────────────── Карточка рассмотрения ─────────────── */

type Decision = null | 'reject' | 'clarify'

function ReviewDialog({
  user,
  objects,
  onClose,
}: {
  user: User | null
  objects: SiteObject[]
  onClose: () => void
}) {
  const approveRegistration = useAppStore((s) => s.approveRegistration)
  const rejectRegistration = useAppStore((s) => s.rejectRegistration)
  const requestClarification = useAppStore((s) => s.requestClarification)

  /* Правки, которые администратор может внести перед подтверждением */
  const [category, setCategory] = useState<UserCategory>('other')
  const [organization, setOrganization] = useState('')
  const [objectIds, setObjectIds] = useState<string[]>([])
  const [roles, setRoles] = useState<Role[]>(['user'])
  const [initialised, setInitialised] = useState<string | null>(null)

  const [decision, setDecision] = useState<Decision>(null)
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState('')

  // Инициализация формы при открытии карточки конкретного пользователя
  if (user && initialised !== user.id) {
    setCategory(user.category)
    setOrganization(user.organization ?? '')
    setObjectIds(user.objectIds)
    setRoles(user.roles.length ? user.roles : ['user'])
    setInitialised(user.id)
    setDecision(null)
    setComment('')
    setCommentError('')
  }

  function close() {
    setInitialised(null)
    onClose()
  }

  function approve() {
    if (!user) return
    approveRegistration(user.id, { category, organization: organization || undefined, objectIds, roles })
    close()
  }

  function submitDecision() {
    if (!user || !decision) return
    if (!comment.trim()) {
      setCommentError(decision === 'reject' ? 'Причина обязательна' : 'Комментарий обязателен')
      return
    }
    if (decision === 'reject') rejectRegistration(user.id, comment)
    else requestClarification(user.id, comment)
    close()
  }

  function toggleRole(role: Role) {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))
  }

  function toggleObject(id: string) {
    setObjectIds((prev) => (prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]))
  }

  const categoryRequiresOrg = category !== 'employee'

  return (
    <Dialog open={user !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent size="xl">
        {user ? (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle>{fullName(user)}</DialogTitle>
                <AccountStatusBadge status={user.accountStatus} size="sm" />
              </div>
              <DialogDescription>
                Регистрация подана {formatDateTime(user.createdAt)} ·{' '}
                {ACCOUNT_STATUSES[user.accountStatus].description}
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4">
              {/* Предыдущее решение, если запись возвращалась на уточнение */}
              {user.clarificationComment ? (
                <div className="flex items-start gap-2 rounded-md border border-status-unpaid-border bg-status-unpaid-soft px-3 py-2.5">
                  <Icon
                    name="refresh"
                    size={14}
                    className="mt-0.5 shrink-0 text-status-unpaid-base"
                  />
                  <div className="min-w-0">
                    <p className="text-2xs font-semibold uppercase tracking-label text-status-unpaid-text">
                      Запрошено уточнение
                      {user.reviewedBy ? ` · ${user.reviewedBy}` : ''}
                    </p>
                    <p className="mt-0.5 text-base text-status-unpaid-text">
                      {user.clarificationComment}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Сведения, поданные пользователем — только для чтения */}
              <section>
                <h3 className="mb-2 text-2xs font-semibold uppercase tracking-label text-content-subtle">
                  Данные из формы регистрации
                </h3>
                <dl className="grid gap-x-5 gap-y-3 rounded-md border border-hairline bg-surface-sunken px-3 py-3 sm:grid-cols-3">
                  <ReadRow label="Фамилия" value={user.lastName} />
                  <ReadRow label="Имя" value={user.firstName} />
                  <ReadRow label="Отчество" value={user.middleName ?? '—'} />
                  <ReadRow label="E-mail" value={user.email} />
                  <ReadRow label="Телефон" value={user.phone} mono />
                  <ReadRow
                    label="Резидентство"
                    value={user.isNonResident ? 'Нерезидент РК' : 'Резидент РК'}
                  />
                  <ReadRow
                    label="Согласие на обработку ПД"
                    value={
                      user.consent
                        ? `${formatDateTime(user.consent.acceptedAt)} · ред. ${user.consent.version}`
                        : '—'
                    }
                    className="sm:col-span-3"
                  />
                </dl>
              </section>

              {/* Правки перед подтверждением */}
              <section>
                <h3 className="mb-2 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-label text-content-subtle">
                  <Icon name="pencil" size={12} />
                  Уточнить перед подтверждением
                </h3>

                <div className="space-y-3 rounded-md border border-hairline bg-surface px-3 py-3">
                  <div className="grid gap-3 sm:grid-cols-2">
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
                      hint={categoryRequiresOrg ? undefined : 'Для сотрудника Общества не требуется'}
                    >
                      <Input
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        disabled={!categoryRequiresOrg}
                        placeholder={
                          categoryRequiresOrg ? 'ТОО «Название компании»' : 'АО «НК «QazExpoCongress»'
                        }
                      />
                    </Field>
                  </div>

                  {/* Роли: по умолчанию «Пользователь», можно назначить дополнительные */}
                  <div>
                    <p className="mb-1.5 text-2xs font-semibold uppercase tracking-label text-content-subtle">
                      Системные роли — выбрано {roles.length}
                    </p>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {(Object.keys(ROLES) as Role[]).map((role) => (
                        <label
                          key={role}
                          className={cn(
                            'flex cursor-pointer items-start gap-2.5 rounded border px-2.5 py-2 transition-colors',
                            roles.includes(role)
                              ? 'border-accent-line bg-accent-soft'
                              : 'border-hairline bg-surface hover:bg-surface-sunken',
                          )}
                        >
                          <Checkbox
                            checked={roles.includes(role)}
                            onCheckedChange={() => toggleRole(role)}
                            className="mt-0.5"
                          />
                          <span className="min-w-0">
                            <span
                              className={cn(
                                'block text-base font-medium',
                                roles.includes(role) ? 'text-accent-strong' : 'text-content',
                              )}
                            >
                              {ROLES[role].label}
                            </span>
                            <span className="block text-xs leading-snug text-content-faint">
                              {ROLES[role].scope}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Закрепление за объектами */}
                  <div>
                    <p className="mb-1.5 text-2xs font-semibold uppercase tracking-label text-content-subtle">
                      Закреплённые объекты — выбрано {objectIds.length}
                    </p>
                    {objectIds.length ? (
                      <div className="mb-1.5 flex flex-wrap gap-1">
                        {objectIds.map((id) => (
                          <Badge key={id} tone="navy" size="sm" icon="building">
                            {objects.find((o) => o.id === id)?.nameRu ?? id}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    <div className="max-h-40 overflow-y-auto rounded border border-hairline">
                      {objects.map((object) => (
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
                          {!object.isActive ? (
                            <span className="shrink-0 text-2xs text-content-faint">неактивен</span>
                          ) : null}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Отклонение либо возврат на уточнение — комментарий обязателен */}
              {decision ? (
                <section
                  className={cn(
                    'rounded-md border px-3 py-3',
                    decision === 'reject'
                      ? 'border-status-conflict-border bg-status-conflict-soft'
                      : 'border-status-unpaid-border bg-status-unpaid-soft',
                  )}
                >
                  <Field
                    label={decision === 'reject' ? 'Причина отклонения' : 'Что требуется уточнить'}
                    required
                    error={commentError}
                    hint="Текст будет направлен пользователю и сохранён в его учётной записи"
                    htmlFor="decision-comment"
                  >
                    <Textarea
                      id="decision-comment"
                      rows={3}
                      value={comment}
                      onChange={(e) => {
                        setComment(e.target.value)
                        if (e.target.value.trim()) setCommentError('')
                      }}
                      invalid={Boolean(commentError)}
                      placeholder={
                        decision === 'reject'
                          ? 'Например: организация не подтверждена, договорные отношения отсутствуют'
                          : 'Например: уточните номер договора и объект размещения'
                      }
                    />
                  </Field>
                </section>
              ) : null}
            </DialogBody>

            <DialogFooter className="justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {decision ? (
                  <Button variant="ghost" size="md" iconLeft="arrow-left" onClick={() => setDecision(null)}>
                    Назад
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      size="md"
                      iconLeft="refresh"
                      onClick={() => setDecision('clarify')}
                    >
                      Вернуть на уточнение
                    </Button>
                    <Button
                      variant="danger"
                      size="md"
                      iconLeft="x-circle"
                      onClick={() => setDecision('reject')}
                    >
                      Отклонить
                    </Button>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="md" onClick={close}>
                  Закрыть
                </Button>
                {decision ? (
                  <Button
                    variant={decision === 'reject' ? 'danger' : 'primary'}
                    size="md"
                    iconLeft="check"
                    onClick={submitDecision}
                  >
                    {decision === 'reject' ? 'Отклонить регистрацию' : 'Отправить на уточнение'}
                  </Button>
                ) : (
                  <Button variant="primary" size="md" iconLeft="check" onClick={approve}>
                    Подтвердить
                  </Button>
                )}
              </div>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function ReadRow({
  label,
  value,
  mono,
  className,
}: {
  label: string
  value: string
  mono?: boolean
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="text-2xs font-semibold uppercase tracking-label text-content-faint">{label}</dt>
      <dd className={cn('mt-0.5 truncate text-base text-content', mono && 'font-mono')}>{value}</dd>
    </div>
  )
}
