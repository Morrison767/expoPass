'use client'

import { Suspense, useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader, PageBody } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import {
  TableWrap,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableToolbar,
} from '@/components/ui/table'
import { StatusBadge, StatusRail, StatusDot } from '@/components/ui/status'
import { Badge, Plate } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { MultiSelect } from '@/components/ui/multi-select'
import { Icon } from '@/components/ui/icon'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore, useCurrentUser } from '@/store/app-store'
import { APPLICATION_STATUS_KEYS, APPLICATION_STATUSES, OPERATIONS } from '@/design/statuses'
import { formatDate, formatDateTime, pluralWithCount } from '@/lib/format'
import type { ApplicationStatus } from '@/lib/types'

/**
 * МОИ ЗАЯВКИ (п. 5.3 ТЗ) — реестр собственных заявок пользователя.
 *
 * Фильтры по статусу, объекту, операции и диапазону дат создания;
 * поиск по номеру; сортировка по заголовкам колонок. Пользователь видит
 * только свои заявки — отбор по applicantId выполняется до всех прочих
 * условий, а не в представлении.
 *
 * Статус может прийти из адреса (`?status=draft,returned`) — так работают
 * кликабельные счётчики на главной странице кабинета.
 */

type SortKey = 'createdAt' | 'validDate' | 'number' | 'status'

export default function ApplicationsPage() {
  return (
    <Suspense fallback={null}>
      <ApplicationsContent />
    </Suspense>
  )
}

function ApplicationsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useCurrentUser()
  const activeRole = useAppStore((s) => s.activeRole)
  const applications = useAppStore((s) => s.applications)
  const objects = useAppStore((s) => s.objects)

  /* Начальный фильтр статусов берём из адреса */
  const initialStatuses = useMemo(() => {
    const raw = searchParams.get('status')
    if (!raw) return []
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => (APPLICATION_STATUS_KEYS as string[]).includes(s))
  }, [searchParams])

  const [statuses, setStatuses] = useState<string[]>(initialStatuses)
  const [objectId, setObjectId] = useState('all')
  const [operation, setOperation] = useState('all')
  const [query, setQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortAsc, setSortAsc] = useState(false)

  const objectName = useCallback(
    (id: string) => objects.find((o) => o.id === id)?.nameRu ?? '—',
    [objects],
  )

  /** Только собственные заявки; суперадминистратор видит все */
  const scope = useMemo(() => {
    if (!user) return []
    return activeRole === 'super_admin'
      ? applications
      : applications.filter((a) => a.applicantId === user.id)
  }, [applications, user, activeRole])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    const rows = scope.filter((app) => {
      if (statuses.length && !statuses.includes(app.status)) return false
      if (objectId !== 'all' && app.objectId !== objectId) return false
      if (operation !== 'all' && app.operation !== operation) return false

      // Диапазон по дате создания
      const created = app.createdAt.slice(0, 10)
      if (dateFrom && created < dateFrom) return false
      if (dateTo && created > dateTo) return false

      if (!q) return true
      return [app.applicationNumber, app.registrationNumber ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    })

    return [...rows].sort((a, b) => {
      let result = 0
      if (sortKey === 'createdAt') result = a.createdAt.localeCompare(b.createdAt)
      else if (sortKey === 'validDate') result = a.validDate.localeCompare(b.validDate)
      else if (sortKey === 'number') result = a.applicationNumber.localeCompare(b.applicationNumber)
      else
        result = APPLICATION_STATUSES[a.status].label.localeCompare(
          APPLICATION_STATUSES[b.status].label,
          'ru',
        )
      return sortAsc ? result : -result
    })
  }, [scope, statuses, objectId, operation, query, dateFrom, dateTo, sortKey, sortAsc])

  const hasFilters =
    statuses.length > 0 ||
    objectId !== 'all' ||
    operation !== 'all' ||
    query.trim() !== '' ||
    dateFrom !== '' ||
    dateTo !== ''

  function resetFilters() {
    setStatuses([])
    setObjectId('all')
    setOperation('all')
    setQuery('')
    setDateFrom('')
    setDateTo('')
    // Убираем ?status= из адреса, иначе фильтр вернётся при перезагрузке
    router.replace('/applications')
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v)
    else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  /* Заявок нет вовсе — отдельное состояние, без панели фильтров */
  if (scope.length === 0) {
    return (
      <>
        <PageHeader icon="file-text" title="Мои заявки" />
        <PageBody>
          <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-hairline bg-surface-sunken text-content-faint shadow-bevel">
              <Icon name="inbox" size={26} />
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight text-content">У вас пока нет заявок</p>
              <p className="mt-1 max-w-md text-md text-content-subtle">
                Оформите материальный пропуск на внос либо вынос товарно-материальных ценностей —
                заявка появится в этом списке.
              </p>
            </div>
            <Button variant="primary" size="lg" iconLeft="plus" className="mt-1" asChild>
              <Link href="/applications/new">Создать первую заявку</Link>
            </Button>
          </Card>
        </PageBody>
      </>
    )
  }

  return (
    <>
      <PageHeader
        icon="file-text"
        title="Мои заявки"
        subtitle={`${pluralWithCount(scope.length, ['заявка', 'заявки', 'заявок'])} · показано ${filtered.length}`}
        actions={
          <Button variant="primary" size="lg" iconLeft="plus" asChild>
            <Link href="/applications/new">Создать заявку</Link>
          </Button>
        }
      />

      <PageBody className="space-y-4">
        <TableWrap>
          <TableToolbar
            left={
              <>
                <div className="w-full sm:w-auto sm:min-w-[13rem]">
                  <Input
                    size="sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    iconLeft="search"
                    placeholder="Номер заявки или пропуска"
                    aria-label="Поиск по номеру заявки"
                  />
                </div>

                <MultiSelect
                  label="Фильтр по статусу"
                  className="w-full sm:w-auto sm:min-w-[11rem]"
                  size="sm"
                  placeholder="Все статусы"
                  value={statuses}
                  onChange={setStatuses}
                  options={APPLICATION_STATUS_KEYS.map((key) => ({
                    value: key,
                    label: APPLICATION_STATUSES[key].label,
                    adornment: <StatusDot status={key} size={7} glow={false} />,
                  }))}
                />

                <Select value={objectId} onValueChange={setObjectId}>
                  <SelectTrigger
                    size="sm"
                    className="w-full sm:w-auto sm:min-w-[10rem]"
                    aria-label="Фильтр по объекту"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все объекты</SelectItem>
                    {objects.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.nameRu}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={operation} onValueChange={setOperation}>
                  <SelectTrigger
                    size="sm"
                    className="w-full sm:w-auto sm:min-w-[8.5rem]"
                    aria-label="Фильтр по операции"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Внос и вынос</SelectItem>
                    <SelectItem value="in">Внос</SelectItem>
                    <SelectItem value="out">Вынос</SelectItem>
                  </SelectContent>
                </Select>
              </>
            }
            right={
              hasFilters ? (
                <Button variant="ghost" size="sm" iconLeft="x" onClick={resetFilters}>
                  Сбросить
                </Button>
              ) : null
            }
          />

          {/* Диапазон дат создания */}
          <div className="flex flex-wrap items-end gap-2 border-b border-hairline bg-surface-sunken px-3 py-2.5">
            <Field label="Создана с" className="w-[calc(50%-0.25rem)] sm:w-40" htmlFor="date-from">
              <Input
                id="date-from"
                size="sm"
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </Field>
            <Field label="по" className="w-[calc(50%-0.25rem)] sm:w-40" htmlFor="date-to">
              <Input
                id="date-to"
                size="sm"
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </Field>
            {statuses.length ? (
              <div className="flex flex-wrap items-center gap-1 pb-1">
                {statuses.map((s) => (
                  <Badge key={s} tone="navy" size="sm">
                    {APPLICATION_STATUSES[s as ApplicationStatus].shortLabel}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-rail p-0" aria-label="Статус" />
                <SortableHead
                  label="№ заявки"
                  active={sortKey === 'number'}
                  asc={sortAsc}
                  onClick={() => toggleSort('number')}
                />
                <TableHead className="hidden xl:table-cell">Тип</TableHead>
                <TableHead className="hidden md:table-cell">Объект</TableHead>
                <TableHead className="hidden lg:table-cell">Операция</TableHead>
                <SortableHead
                  label="Дата действия"
                  className="hidden sm:table-cell"
                  active={sortKey === 'validDate'}
                  asc={sortAsc}
                  onClick={() => toggleSort('validDate')}
                />
                <SortableHead
                  label="Статус"
                  active={sortKey === 'status'}
                  asc={sortAsc}
                  onClick={() => toggleSort('status')}
                />
                <SortableHead
                  label="Создана"
                  className="hidden lg:table-cell"
                  active={sortKey === 'createdAt'}
                  asc={sortAsc}
                  onClick={() => toggleSort('createdAt')}
                />
                <TableHead className="w-9" aria-label="Открыть" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-12">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <span className="flex h-10 w-10 items-center justify-center rounded-md border border-hairline bg-surface-sunken text-content-faint">
                        <Icon name="filter" size={18} />
                      </span>
                      <p className="text-md font-medium text-content">Ничего не найдено</p>
                      <p className="max-w-sm text-base text-content-faint">
                        Ни одна заявка не подходит под текущие условия отбора.
                      </p>
                      <Button variant="secondary" size="md" className="mt-1" onClick={resetFilters}>
                        Сбросить фильтры
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <TableRow
                    key={app.id}
                    interactive
                    onClick={() => router.push(`/applications/view?id=${app.id}`)}
                  >
                    <td className="w-rail p-0">
                      <StatusRail status={app.status} rounded={false} glow={false} />
                    </td>
                    <TableCell className="whitespace-nowrap">
                      <Plate tone={app.registrationNumber ? 'accent' : 'default'}>
                        {app.registrationNumber ?? app.applicationNumber}
                      </Plate>
                      {app.registrationNumber ? (
                        <span className="mt-0.5 block font-mono text-2xs text-content-faint">
                          {app.applicationNumber}
                        </span>
                      ) : null}
                      {/* На узком экране колонки скрыты — сворачиваем главное сюда */}
                      <span className="mt-0.5 block text-2xs text-content-faint sm:hidden">
                        {formatDate(app.validDate)} · {OPERATIONS[app.operation].label}
                      </span>
                      <span className="block max-w-[11rem] truncate text-2xs text-content-faint md:hidden">
                        {objectName(app.objectId)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap xl:table-cell">
                      Материальный пропуск
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="block max-w-[12rem] truncate">
                        {objectName(app.objectId)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge tone="outline" size="sm" icon={OPERATIONS[app.operation].icon}>
                        {OPERATIONS[app.operation].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap tabular-nums text-content sm:table-cell">
                      {formatDate(app.validDate)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={app.status} size="sm" short />
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-sm tabular-nums lg:table-cell">
                      {formatDateTime(app.createdAt)}
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
      </PageBody>
    </>
  )
}

function SortableHead({
  label,
  active,
  asc,
  onClick,
  className,
}: {
  label: string
  active: boolean
  asc: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={onClick}
        className="focus-ring inline-flex items-center gap-1 rounded-sm text-2xs font-semibold uppercase tracking-label text-content-faint transition-colors hover:text-content"
      >
        {label}
        <Icon
          name={active ? (asc ? 'chevron-up' : 'chevron-down') : 'chevron-down'}
          size={11}
          className={active ? 'text-accent' : 'opacity-40'}
        />
      </button>
    </TableHead>
  )
}
