'use client'

import { useMemo, useState } from 'react'
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
import { Badge, Plate } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
import type { SiteObject } from '@/lib/types'

/**
 * СПРАВОЧНИК ОБЪЕКТОВ (Приложение 1 ТЗ).
 *
 * Добавление, переименование, деактивация, порядок отображения и
 * назначение ответственного администратора выполняются администратором
 * и не требуют изменения программного кода (п. 8.1 ТЗ).
 * Наименования ведутся на казахском, русском и английском языках.
 */
export default function AdminObjectsPage() {
  const objects = useAppStore((s) => s.objects)
  const users = useAppStore((s) => s.users)
  const applications = useAppStore((s) => s.applications)
  const updateObject = useAppStore((s) => s.updateObject)
  const addObject = useAppStore((s) => s.addObject)

  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<SiteObject | null>(null)
  const [creating, setCreating] = useState(false)

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...objects]
      .sort((a, b) => a.order - b.order)
      .filter((o) =>
        q ? [o.nameRu, o.nameKk, o.nameEn].join(' ').toLowerCase().includes(q) : true,
      )
  }, [objects, query])

  const adminName = (id?: string) => {
    const user = users.find((u) => u.id === id)
    return user ? fullName(user) : null
  }

  const usageCount = (objectId: string) =>
    applications.filter((a) => a.objectId === objectId).length

  return (
    <>
      <PageHeader
        icon="building"
        title="Объекты"
        subtitle="Павильоны, блоки и здания комплекса; наименования KZ / RU / EN"
        actions={
          <Button variant="primary" size="md" iconLeft="plus" onClick={() => setCreating(true)}>
            Добавить объект
          </Button>
        }
      />

      <PageBody className="space-y-4">
        <section className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Всего объектов" value={objects.length} icon="building" />
          <StatTile
            label="Активных"
            value={objects.filter((o) => o.isActive).length}
            icon="check"
            chip="confirmed"
            hint="Доступны для выбора в заявке"
          />
          <StatTile
            label="С администратором"
            value={objects.filter((o) => o.adminUserId).length}
            icon="user"
            chip="paid"
            hint="Назначен ответственный согласующий"
          />
        </section>

        <TableWrap>
          <TableToolbar
            left={
              <div className="min-w-[16rem]">
                <Input
                  size="sm"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  iconLeft="search"
                  placeholder="Поиск по наименованию…"
                  aria-label="Поиск объектов"
                />
              </div>
            }
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-right">№</TableHead>
                <TableHead>Наименование (RU)</TableHead>
                <TableHead>Қазақша</TableHead>
                <TableHead>English</TableHead>
                <TableHead>Администратор объекта</TableHead>
                <TableHead className="text-right">Заявок</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-9" aria-label="Действия" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableEmpty colSpan={8} icon="building" title="Объекты не найдены" />
              ) : (
                sorted.map((object) => (
                  <TableRow key={object.id}>
                    <TableCell className="w-12 text-right tabular-nums text-content-faint">
                      {object.order}
                    </TableCell>
                    <TableCell className="font-medium text-content">
                      <span className="block max-w-[18rem] truncate">{object.nameRu}</span>
                    </TableCell>
                    <TableCell>
                      <span className="block max-w-[14rem] truncate">{object.nameKk}</span>
                    </TableCell>
                    <TableCell>
                      <span className="block max-w-[14rem] truncate">{object.nameEn}</span>
                    </TableCell>
                    <TableCell>
                      {adminName(object.adminUserId) ? (
                        <span className="block max-w-[13rem] truncate">
                          {adminName(object.adminUserId)}
                        </span>
                      ) : (
                        <span className="text-content-faint">Не назначен</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {usageCount(object.id) || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        tone={object.isActive ? 'navy' : 'neutral'}
                        size="sm"
                        icon={object.isActive ? 'check' : 'ban'}
                      >
                        {object.isActive ? 'Активен' : 'Деактивирован'}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-9 px-2">
                      <IconButton
                        icon="pencil"
                        label={`Изменить ${object.nameRu}`}
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setEditing(object)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableWrap>
      </PageBody>

      <ObjectDialog
        object={editing}
        open={editing !== null || creating}
        nextOrder={objects.length + 1}
        users={users}
        onClose={() => {
          setEditing(null)
          setCreating(false)
        }}
        onSave={(values) => {
          if (editing) {
            updateObject(editing.id, values)
          } else {
            addObject(values as Omit<SiteObject, 'id'>)
          }
          setEditing(null)
          setCreating(false)
        }}
      />
    </>
  )
}

/* ─────────────── Диалог объекта ─────────────── */

function ObjectDialog({
  object,
  open,
  nextOrder,
  users,
  onClose,
  onSave,
}: {
  object: SiteObject | null
  open: boolean
  nextOrder: number
  users: Array<import('@/lib/types').User>
  onClose: () => void
  onSave: (values: Omit<SiteObject, 'id'>) => void
}) {
  const [nameRu, setNameRu] = useState('')
  const [nameKk, setNameKk] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [order, setOrder] = useState(nextOrder)
  const [isActive, setIsActive] = useState(true)
  const [adminUserId, setAdminUserId] = useState<string>('none')
  const [initialised, setInitialised] = useState<string | null>(null)

  const key = object?.id ?? (open ? 'new' : null)

  // Поля инициализируются один раз на открытие диалога
  if (open && initialised !== key) {
    setNameRu(object?.nameRu ?? '')
    setNameKk(object?.nameKk ?? '')
    setNameEn(object?.nameEn ?? '')
    setOrder(object?.order ?? nextOrder)
    setIsActive(object?.isActive ?? true)
    setAdminUserId(object?.adminUserId ?? 'none')
    setInitialised(key)
  }

  // Администратором объекта можно назначить пользователя с этой ролью
  const candidates = users.filter((u) => u.roles.includes('object_admin') || u.roles.includes('super_admin'))

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setInitialised(null)
          onClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{object ? 'Изменить объект' : 'Новый объект'}</DialogTitle>
          <DialogDescription>
            Наименования на трёх языках, порядок отображения и ответственный согласующий
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3">
          <Field label="Наименование (русский)" required htmlFor="name-ru">
            <Input id="name-ru" value={nameRu} onChange={(e) => setNameRu(e.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Қазақша" htmlFor="name-kk">
              <Input id="name-kk" value={nameKk} onChange={(e) => setNameKk(e.target.value)} />
            </Field>
            <Field label="English" htmlFor="name-en">
              <Input id="name-en" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Порядок отображения" htmlFor="order">
              <Input
                id="order"
                type="number"
                min={1}
                value={order}
                onChange={(e) => setOrder(Number(e.target.value) || 1)}
              />
            </Field>
            <Field label="Администратор объекта">
              <Select value={adminUserId} onValueChange={setAdminUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Не назначен" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не назначен</SelectItem>
                  {candidates.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {fullName(user)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 rounded border border-hairline bg-surface px-2.5 py-2">
            <Checkbox
              checked={isActive}
              onCheckedChange={(v) => setIsActive(v === true)}
              className="mt-0.5"
            />
            <span>
              <span className="block text-base font-medium text-content">Объект активен</span>
              <span className="block text-xs text-content-faint">
                Неактивные объекты недоступны для выбора в новых заявках
              </span>
            </span>
          </label>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" size="md" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            size="md"
            iconLeft="check"
            disabled={!nameRu.trim()}
            onClick={() =>
              onSave({
                nameRu: nameRu.trim(),
                nameKk: nameKk.trim() || nameRu.trim(),
                nameEn: nameEn.trim() || nameRu.trim(),
                order,
                isActive,
                adminUserId: adminUserId === 'none' ? undefined : adminUserId,
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
