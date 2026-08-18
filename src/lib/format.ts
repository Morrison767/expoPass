/**
 * Форматирование дат и размеров.
 * Рабочая временная зона — локальное время Астаны (п. 17 ТЗ).
 */

const DATE_FORMAT = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const DATE_LONG_FORMAT = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const DATETIME_FORMAT = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** ДД.ММ.ГГГГ */
export function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  return Number.isNaN(date.getTime()) ? '—' : DATE_FORMAT.format(date)
}

/** 21 августа 2026 г. */
export function formatDateLong(value?: string) {
  if (!value) return '—'
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  return Number.isNaN(date.getTime()) ? '—' : DATE_LONG_FORMAT.format(date)
}

/** ДД.ММ.ГГГГ, ЧЧ:ММ */
export function formatDateTime(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : DATETIME_FORMAT.format(date)
}

/** Размер файла в человекочитаемом виде */
export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

/** Склонение существительного по числу: 1 позиция, 2 позиции, 5 позиций */
export function plural(count: number, forms: [string, string, string]) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}

/** «3 позиции» */
export function pluralWithCount(count: number, forms: [string, string, string]) {
  return `${count} ${plural(count, forms)}`
}
