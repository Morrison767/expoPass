'use client'

import { useCallback, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
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
import { StatusBadge, StatusRail } from '@/components/ui/status'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { Icon } from '@/components/ui/icon'
import { toast } from '@/components/ui/toast'
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
import { DecisionDialog, type DecisionKind } from '@/components/applications/decision-dialog'
import { PassDocument } from '@/components/pass-document'
import { useAppStore, useCurrentUser, todayIso } from '@/store/app-store'
import { APPLICATION_STATUS_KEYS, APPLICATION_STATUSES, OPERATIONS } from '@/design/statuses'
import { formatDate, formatDateTime, pluralWithCount } from '@/lib/format'
import type { Application, ApplicationStatus } from '@/lib/types'

/**
 * РЕЕСТР МАТЕРИАЛЬНЫХ ПРОПУСКОВ (п. 8.12 ТЗ).
 *
 * Состав колонок соответствует минимальному перечню ТЗ. Доступны поиск,
 * фильтры, сортировка, постраничный вывод и экспорт в CSV.
 * Администратор объекта видит только записи по своим объектам.
 */

const PAGE_SIZE = 10

type SortKey = 'registeredAt' | 'validDate' | 'applicant' | 'object'

export default function RegistryPage() {
  const user = useCurrentUser()
  const activeRole = useAppStore((s) => s.activeRole)
  const applications = useAppStore((s) => s.applications)
  const objects = useAppStore((s) => s.objects)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all')
  const [operationFilter, setOperationFilter] = useState<'all' | 'in' | 'out'>('all')
  const [objectFilter, setObjectFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('registeredAt')
  const [sortAsc, setSortAsc] = useState(false)
  const [page, setPage] = useState(0)
  const [cancelTarget, setCancelTarget] = useState<Application | null>(null)
  const [documentTarget, setDocumentTarget] = useState<Application | null>(null)

  const cancelApplication = useAppStore((s) => s.cancelApplication)

  /** Аннулирование — полномочие ГОЦ и суперадминистратора (п. 4.2 ТЗ) */
  const canCancel = activeRole === 'goc_officer' || activeRole === 'super_admin'

  const objectName = useCallback(
    (id: string) => objects.find((o) => o.id === id)?.nameRu ?? '—',
    [objects],
  )

  // Реестр ведёт ГОЦ; администратор объекта ограничен своими объектами
  const scope = useMemo(() => {
    if (activeRole === 'object_admin' && user) {
      return applications.filter((a) => user.objectIds.includes(a.objectId))
    }
    return applications
  }, [applications, activeRole, user])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = scope.filter((app) => {
      if (statusFilter !== 'all' && app.status !== statusFilter) return false
      if (operationFilter !== 'all' && app.operation !== operationFilter) return false
      if (objectFilter !== 'all' && app.objectId !== objectFilter) return false
      // Период — по дате действия пропуска: именно её спрашивают на КПП
      if (dateFrom && app.validDate < dateFrom) return false
      if (dateTo && app.validDate > dateTo) return false
      if (!q) return true
      return [
        app.registrationNumber ?? '',
        app.applicationNumber,
        app.applicantName,
        app.organization,
        app.basis,
        objectName(app.objectId),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })

    const sorted = [...rows].sort((a, b) => {
      let result = 0
      if (sortKey === 'registeredAt') {
        result = (a.registeredAt ?? a.createdAt).localeCompare(b.registeredAt ?? b.createdAt)
      } else if (sortKey === 'validDate') {
        result = a.validDate.localeCompare(b.validDate)
      } else if (sortKey === 'applicant') {
        result = a.applicantName.localeCompare(b.applicantName, 'ru')
      } else {
        result = objectName(a.objectId).localeCompare(objectName(b.objectId), 'ru')
      }
      return sortAsc ? result : -result
    })

    return sorted
  }, [
    scope,
    query,
    statusFilter,
    operationFilter,
    objectFilter,
    dateFrom,
    dateTo,
    sortKey,
    sortAsc,
    objectName,
  ])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((v) => !v)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  /**
   * Экспорт реестра с учётом текущих фильтров и прав (п. 13 ТЗ).
   * XLSX формируется на клиенте: выгружается ровно то, что видит
   * пользователь после отбора, — не весь массив.
   */
  function buildRows() {
    const header = [
      'Регистрационный номер',
      'Номер заявки',
      'Дата регистрации',
      'Дата действия',
      'Заявитель',
      'Организация',
      'Операция',
      'Объект',
      'Основание',
      'Позиций ТМЦ',
      'Способ подтверждения',
      'Администратор объекта',
      'Сотрудник ГОЦ',
      'Статус',
    ]

    const rows = filtered.map((app) => [
      app.registrationNumber ?? '',
      app.applicationNumber,
      app.registeredAt ? formatDateTime(app.registeredAt) : '',
      formatDate(app.validDate),
      app.applicantName,
      app.organization,
      OPERATIONS[app.operation].label,
      objectName(app.objectId),
      app.basis.replace(/\s+/g, ' '),
      app.items.length,
      app.isNonResident ? 'Паспорт нерезидента' : 'ЭЦП',
      app.objectAdminName ?? '',
      app.gocOfficerName ?? '',
      APPLICATION_STATUSES[app.status].label,
    ])

    return { header, rows }
  }

  function exportXlsx() {
    const { header, rows } = buildRows()
    const sheet = XLSX.utils.aoa_to_sheet([header, ...rows])

    // Ширины колонок: без них кириллица обрезается прямо при открытии
    sheet['!cols'] = [18, 16, 18, 14, 26, 26, 10, 24, 46, 12, 22, 26, 26, 22].map((w) => ({ wch: w }))
    sheet['!autofilter'] = { ref: XLSX.utils.encode_range({
      s: { c: 0, r: 0 },
      e: { c: header.length - 1, r: rows.length },
    }) }

    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'Материальные пропуска')
    XLSX.writeFile(book, `reestr-materialnyh-propuskov-${todayIso()}.xlsx`)

    toast.success('Реестр выгружен', `Строк в файле: ${rows.length}`)
  }

  function exportCsv() {
    const { header, rows } = buildRows()

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n')

    // BOM, чтобы Excel корректно открыл кириллицу
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reestr-materialnyh-propuskov-${todayIso()}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast.success('Реестр выгружен в CSV', `Строк в файле: ${rows.length}`)
  }

  const hasFilters =
    query.trim() !== '' ||
    statusFilter !== 'all' ||
    operationFilter !== 'all' ||
    objectFilter !== 'all' ||
    dateFrom !== '' ||
    dateTo !== ''

  function resetFilters() {
    setQuery('')
    setStatusFilter('all')
    setOperationFilter('all')
    setObjectFilter('all')
    setDateFrom('')
    setDateTo('')
    setPage(0)
  }

  return (
    <>
      <PageHeader
        icon="table"
        title="Реестр материальных пропусков"
        subtitle={`${pluralWithCount(filtered.length, ['запись', 'записи', 'записей'])} по текущим условиям отбора`}
        actions={
          <>
            <Button variant="secondary" size="md" iconLeft="download" onClick={exportCsv}>
              CSV
            </Button>
            <Button variant="primary" size="md" iconLeft="table" onClick={exportXlsx}>
              Экспорт в XLSX
            </Button>
          </>
        }
      />

      <PageBody>
        <TableWrap>
          <TableToolbar
            left={
              <>
                <div className="w-full sm:w-auto sm:min-w-[14rem]">
                  <Input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setPage(0)
                    }}
                    iconLeft="search"
                    size="sm"
                    placeholder="Номер, Ф.И.О., организация, объект…"
                    aria-label="Поиск по реестру"
                  />
                </div>

                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v as typeof statusFilter)
                    setPage(0)
                  }}
                >
                  <SelectTrigger size="sm" className="w-full sm:w-auto sm:min-w-[10rem]" aria-label="Статус">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    {APPLICATION_STATUS_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {APPLICATION_STATUSES[key].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={operationFilter}
                  onValueChange={(v) => {
                    setOperationFilter(v as typeof operationFilter)
                    setPage(0)
                  }}
                >
                  <SelectTrigger size="sm" className="w-full sm:w-auto sm:min-w-[8.5rem]" aria-label="Операция">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Внос и вынос</SelectItem>
                    <SelectItem value="in">Внос</SelectItem>
                    <SelectItem value="out">Вынос</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={objectFilter}
                  onValueChange={(v) => {
                    setObjectFilter(v)
                    setPage(0)
                  }}
                >
                  <SelectTrigger size="sm" className="w-full sm:w-auto sm:min-w-[10rem]" aria-label="Объект">
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

                {hasFilters ? (
                  <Button variant="ghost" size="sm" iconLeft="x" onClick={resetFilters}>
                    Сбросить
                  </Button>
                ) : null}
              </>
            }
          />

          {/* Период по дате действия пропуска */}
          <div className="flex flex-wrap items-end gap-2 border-b border-hairline bg-surface-sunken px-3 py-2.5">
            <Field label="Дата действия с" className="w-[calc(50%-0.25rem)] sm:w-40" htmlFor="reg-date-from">
              <Input
                id="reg-date-from"
                size="sm"
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setPage(0)
                }}
              />
            </Field>
            <Field label="по" className="w-[calc(50%-0.25rem)] sm:w-40" htmlFor="reg-date-to">
              <Input
                id="reg-date-to"
                size="sm"
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(0)
                }}
              />
            </Field>

            {/* Быстрые периоды — самые частые запросы на КПП */}
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDateFrom(todayIso())
                  setDateTo(todayIso())
                  setPage(0)
                }}
              >
                Сегодня
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const from = new Date()
                  from.setDate(from.getDate() - 30)
                  setDateFrom(from.toISOString().slice(0, 10))
                  setDateTo(todayIso())
                  setPage(0)
                }}
              >
                30 дней
              </Button>
            </div>

            <span className="ml-auto pb-1.5 text-xs tabular-nums text-content-faint">
              Отобрано {filtered.length} из {scope.length}
            </span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-rail p-0" aria-label="Статус" />
                <TableHead>Рег. номер</TableHead>
                <TableHead className="hidden xl:table-cell">Заявка</TableHead>
                <SortableHead
                  label="Регистрация"
                  className="hidden lg:table-cell"
                  active={sortKey === 'registeredAt'}
                  asc={sortAsc}
                  onClick={() => toggleSort('registeredAt')}
                />
                <SortableHead
                  label="Дата действия"
                  className="hidden sm:table-cell"
                  active={sortKey === 'validDate'}
                  asc={sortAsc}
                  onClick={() => toggleSort('validDate')}
                />
                <SortableHead
                  label="Заявитель"
                  className="hidden md:table-cell"
                  active={sortKey === 'applicant'}
                  asc={sortAsc}
                  onClick={() => toggleSort('applicant')}
                />
                <TableHead className="hidden md:table-cell">Операция</TableHead>
                <SortableHead
                  label="Объект"
                  className="hidden lg:table-cell"
                  active={sortKey === 'object'}
                  asc={sortAsc}
                  onClick={() => toggleSort('object')}
                />
                <TableHead className="hidden xl:table-cell">Основание</TableHead>
                <TableHead className="hidden text-right xl:table-cell">Позиций</TableHead>
                <TableHead className="hidden xl:table-cell">Подтверждение</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-9" aria-label="Действия" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableEmpty
                  colSpan={13}
                  title={hasFilters ? 'Ничего не найдено' : 'Реестр пуст'}
                  hint={
                    hasFilters
                      ? 'Измените условия отбора или сбросьте фильтры.'
                      : 'Записи появятся после регистрации первого пропуска.'
                  }
                />
              ) : (
                pageRows.map((app) => (
                  <TableRow key={app.id} interactive>
                    <td className="w-rail p-0">
                      <StatusRail status={app.status} rounded={false} glow={false} />
                    </td>
                    <TableCell className="whitespace-nowrap font-mono text-sm font-medium text-content">
                      {app.registrationNumber ?? '—'}
                      {/* На узком экране колонки скрыты — сворачиваем главное сюда */}
                      <span className="mt-0.5 block font-sans text-2xs font-normal text-content-faint sm:hidden">
                        {formatDate(app.validDate)} · {OPERATIONS[app.operation].label}
                      </span>
                      <span className="block max-w-[11rem] truncate font-sans text-2xs font-normal text-content-faint md:hidden">
                        {app.applicantName}
                      </span>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap font-mono text-sm xl:table-cell">
                      {app.applicationNumber}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-sm tabular-nums lg:table-cell">
                      {app.registeredAt ? formatDateTime(app.registeredAt) : '—'}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap tabular-nums text-content sm:table-cell">
                      {formatDate(app.validDate)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="block max-w-[12rem] truncate text-content">
                        {app.applicantName}
                      </span>
                      <span className="block max-w-[12rem] truncate text-2xs text-content-faint">
                        {app.organization}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge tone="outline" size="sm" icon={OPERATIONS[app.operation].icon}>
                        {OPERATIONS[app.operation].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="block max-w-[11rem] truncate">{objectName(app.objectId)}</span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {/* Основание бывает длинным — в строке обрезаем, полностью видно в подсказке */}
                      <span className="block max-w-[16rem] truncate" title={app.basis}>
                        {app.basis}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums text-content xl:table-cell">
                      {app.items.length}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <Badge
                        tone={app.isNonResident ? 'signal' : 'navy'}
                        size="sm"
                        icon={app.isNonResident ? 'id-card' : 'pen'}
                      >
                        {app.isNonResident ? 'Паспорт' : 'ЭЦП'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={app.status} size="sm" short />
                    </TableCell>
                    <TableCell className="w-9 px-2">
                      <span className="flex items-center justify-end gap-0.5">
                        {/* Ссылка на итоговый PDF — обязательная колонка п. 8.12 ТЗ */}
                        {app.status === 'registered' || app.status === 'expired' ? (
                          <button
                            type="button"
                            onClick={() => setDocumentTarget(app)}
                            aria-label={`Открыть PDF пропуска ${app.registrationNumber}`}
                            title="Итоговый PDF"
                            className="focus-ring inline-flex h-control-sm w-control-sm items-center justify-center rounded-sm text-accent-fg transition-colors hover:bg-accent-soft"
                          >
                            <Icon name="file-text" size={14} />
                          </button>
                        ) : null}

                        {/* Аннулировать может ГОЦ и суперадминистратор — только действующий пропуск */}
                        {app.status === 'registered' && canCancel ? (
                          <button
                            type="button"
                            onClick={() => setCancelTarget(app)}
                            aria-label={`Аннулировать пропуск ${app.registrationNumber}`}
                            title="Аннулировать пропуск"
                            className="focus-ring inline-flex h-control-sm w-control-sm items-center justify-center rounded-sm text-content-faint transition-colors hover:bg-danger-600 hover:text-white"
                          >
                            <Icon name="ban" size={14} />
                          </button>
                        ) : null}
                        <Link
                          href={`/applications/view?id=${app.id}`}
                          aria-label={`Открыть заявку ${app.applicationNumber}`}
                          className="focus-ring inline-flex h-control-sm w-control-sm items-center justify-center rounded-sm text-content-faint transition-colors hover:bg-surface-muted hover:text-content"
                        >
                          <Icon name="chevron-right" size={14} />
                        </Link>
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Постраничный вывод */}
          {filtered.length > PAGE_SIZE ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline bg-surface-sunken px-3 py-2.5">
              <span className="text-xs tabular-nums text-content-faint">
                Показаны {safePage * PAGE_SIZE + 1}–
                {Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} из {filtered.length}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft="chevron-left"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Назад
                </Button>
                <span className="px-1 text-xs tabular-nums text-content-muted">
                  {safePage + 1} / {pageCount}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  iconRight="chevron-right"
                  disabled={safePage >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                >
                  Вперёд
                </Button>
              </div>
            </div>
          ) : null}
        </TableWrap>
      </PageBody>

      {/* Итоговый документ прямо из строки реестра */}
      <Dialog open={documentTarget !== null} onOpenChange={(open) => !open && setDocumentTarget(null)}>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>Материальный пропуск</DialogTitle>
            <DialogDescription>
              {documentTarget?.registrationNumber} · {documentTarget?.applicantName}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="bg-surface-sunken">
            {documentTarget ? (
              <PassDocument
                application={documentTarget}
                objectName={objectName(documentTarget.objectId)}
              />
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" size="md" onClick={() => setDocumentTarget(null)}>
              Закрыть
            </Button>
            <Button variant="secondary" size="md" iconLeft="download" onClick={() => window.print()}>
              Печать / сохранить PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DecisionDialog
        kind={cancelTarget ? 'cancel' : null}
        applicationNumber={cancelTarget?.registrationNumber ?? cancelTarget?.applicationNumber}
        onClose={() => setCancelTarget(null)}
        onConfirm={(kind: DecisionKind, comment: string) => {
          if (!cancelTarget || kind !== 'cancel') return
          cancelApplication(cancelTarget.id, comment)
          toast.danger(
            'Пропуск аннулирован',
            `${cancelTarget.registrationNumber ?? cancelTarget.applicationNumber} — заявитель уведомлён`,
          )
          setCancelTarget(null)
        }}
      />
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
