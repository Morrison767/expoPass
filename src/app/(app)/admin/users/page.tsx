'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
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
  TableToolbar,
} from '@/components/ui/table'
import { AccountStatusBadge } from '@/components/ui/status'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
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
import { formatDate } from '@/lib/format'
import type { AccountStatus, Role, User } from '@/lib/types'

/**
 * УПРАВЛЕНИЕ УЧЁТНЫМИ ЗАПИСЯМИ (п. 6 ТЗ).
 * Администратор подтверждает и отклоняет регистрации, меняет данные,
 * назначает роли и объекты, блокирует и деактивирует учётные записи —
 * всё без обращения к разработчику.
 */
export default function AdminUsersPage() {
  const users = useAppStore((s) => s.users)
  const objects = useAppStore((s) => s.objects)
  const updateUser = useAppStore((s) => s.updateUser)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all')
  const [editing, setEditing] = useState<User | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((user) => {
      if (statusFilter !== 'all' && user.accountStatus !== statusFilter) return false
      if (!q) return true
      return [fullName(user), user.email, user.phone, user.organization ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [users, query, statusFilter])

  const pending = users.filter((u) => u.accountStatus === 'pending_admin_confirmation')

  return (
    <>
      <PageHeader
        icon="users"
        title="Пользователи"
        subtitle="Учётные записи, роли и закрепление за объектами"
      />

      <PageBody className="space-y-4">
        <section className="grid gap-3 sm:grid-cols-4">
          <StatTile label="Всего" value={users.length} icon="users" />
          <StatTile
            label="Ожидают подтверждения"
            value={pending.length}
            icon="clock"
            chip="review"
            hint="Новые регистрации"
          />
          <StatTile
            label="Активных"
            value={users.filter((u) => u.accountStatus === 'active').length}
            icon="check"
            chip="confirmed"
          />
          <StatTile
            label="Заблокировано"
            value={
              users.filter((u) => u.accountStatus === 'blocked' || u.accountStatus === 'deactivated')
                .length
            }
            icon="lock"
            chip="neutral"
          />
        </section>

        {/* Рассмотрение регистраций вынесено в отдельный раздел: там решение
            принимается с обязательной причиной и правкой данных заявителя */}
        {pending.length ? (
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-status-review-border bg-status-review-soft px-3.5 py-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <Icon name="clock" size={16} className="mt-0.5 shrink-0 text-status-review-base" />
              <div className="min-w-0">
                <p className="text-md font-semibold text-status-review-text">
                  Ожидают подтверждения — {pending.length}
                </p>
                <p className="mt-0.5 text-base text-status-review-text">
                  До подтверждения администратором создание заявок для этих пользователей закрыто.
                </p>
              </div>
            </div>
            <Button variant="primary" size="md" iconRight="arrow-right" asChild>
              <Link href="/admin/registrations">Перейти к очереди регистраций</Link>
            </Button>
          </section>
        ) : null}

        <TableWrap>
          <TableToolbar
            left={
              <>
                <div className="w-full sm:w-auto sm:min-w-[14rem]">
                  <Input
                    size="sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    iconLeft="search"
                    placeholder="Ф.И.О., e-mail, организация…"
                    aria-label="Поиск пользователей"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
                >
                  <SelectTrigger size="sm" className="w-full sm:w-auto sm:min-w-[11rem]" aria-label="Статус">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    {(Object.keys(ACCOUNT_STATUSES) as AccountStatus[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {ACCOUNT_STATUSES[key].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
            right={
              <Button variant="secondary" size="sm" iconLeft="plus" disabled>
                Создать учётную запись
              </Button>
            }
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead>Контакты</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Организация</TableHead>
                <TableHead>Роли</TableHead>
                <TableHead>Объекты</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Создана</TableHead>
                <TableHead className="w-9" aria-label="Действия" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableEmpty colSpan={9} icon="users" title="Пользователи не найдены" />
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <span className="block max-w-[13rem] truncate font-medium text-content">
                        {fullName(user)}
                      </span>
                      {user.isNonResident ? (
                        <span className="text-2xs text-signal-700">Нерезидент РК</span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <span className="block max-w-[12rem] truncate">{user.email}</span>
                      <span className="block text-2xs tabular-nums text-content-faint">
                        {user.phone}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block max-w-[10rem] truncate">
                        {USER_CATEGORIES[user.category].label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block max-w-[11rem] truncate">{user.organization ?? '—'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role} tone="navy" size="sm">
                            {ROLES[role].short}
                          </Badge>
                        ))}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {user.objectIds.length ? user.objectIds.length : '—'}
                    </TableCell>
                    <TableCell>
                      <AccountStatusBadge status={user.accountStatus} size="sm" />
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-sm">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="w-9 px-2">
                      <IconButton
                        icon="pencil"
                        label={`Изменить ${fullName(user)}`}
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setEditing(user)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableWrap>
      </PageBody>

      <EditUserDialog
        user={editing}
        objects={objects}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (editing) updateUser(editing.id, patch)
          setEditing(null)
        }}
      />
    </>
  )
}

/* ─────────────── Диалог редактирования ─────────────── */

function EditUserDialog({
  user,
  objects,
  onClose,
  onSave,
}: {
  user: User | null
  objects: Array<import('@/lib/types').SiteObject>
  onClose: () => void
  onSave: (patch: Partial<User>) => void
}) {
  const [roles, setRoles] = useState<Role[]>([])
  const [objectIds, setObjectIds] = useState<string[]>([])
  const [accountStatus, setAccountStatus] = useState<AccountStatus>('active')
  const [phone, setPhone] = useState('')
  const [organization, setOrganization] = useState('')
  const [initialised, setInitialised] = useState<string | null>(null)

  // Инициализация полей при открытии диалога для конкретного пользователя
  if (user && initialised !== user.id) {
    setRoles(user.roles)
    setObjectIds(user.objectIds)
    setAccountStatus(user.accountStatus)
    setPhone(user.phone)
    setOrganization(user.organization ?? '')
    setInitialised(user.id)
  }

  function toggleRole(role: Role) {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))
  }

  function toggleObject(id: string) {
    setObjectIds((prev) => (prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]))
  }

  return (
    <Dialog
      open={user !== null}
      onOpenChange={(open) => {
        if (!open) {
          setInitialised(null)
          onClose()
        }
      }}
    >
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{user ? fullName(user) : ''}</DialogTitle>
          <DialogDescription>
            Роли, закрепление за объектами и статус учётной записи
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Телефон">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Организация">
              <Input value={organization} onChange={(e) => setOrganization(e.target.value)} />
            </Field>
          </div>

          <Field label="Статус учётной записи">
            <Select value={accountStatus} onValueChange={(v) => setAccountStatus(v as AccountStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ACCOUNT_STATUSES) as AccountStatus[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {ACCOUNT_STATUSES[key].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div>
            <p className="mb-1.5 text-2xs font-semibold uppercase tracking-label text-content-subtle">
              Системные роли
            </p>
            <div className="space-y-1.5">
              {(Object.keys(ROLES) as Role[]).map((role) => (
                <label
                  key={role}
                  className="flex cursor-pointer items-start gap-2.5 rounded border border-hairline bg-surface px-2.5 py-2 transition-colors hover:bg-surface-sunken"
                >
                  <Checkbox
                    checked={roles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                    className="mt-0.5"
                  />
                  <span className="min-w-0">
                    <span className="block text-base font-medium text-content">
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

          <div>
            <p className="mb-1.5 text-2xs font-semibold uppercase tracking-label text-content-subtle">
              Закреплённые объекты — {objectIds.length}
            </p>
            <div className="max-h-48 overflow-y-auto rounded border border-hairline">
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
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" size="md" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            size="md"
            iconLeft="check"
            onClick={() =>
              onSave({
                roles: roles.length ? roles : ['user'],
                objectIds,
                accountStatus,
                phone,
                organization: organization || undefined,
              })
            }
          >
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
