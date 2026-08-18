import { cn } from '@/lib/cn'
import type { ReactNode, SVGProps } from 'react'

/**
 * Иконки системы. Единая сетка 16×16, обводка 1.6, скруглённые концы —
 * визуально согласуются с 13px-текстом и не «шумят» в плотных таблицах.
 * Набор перенесён из ИС учёта мероприятий и дополнен глифами пропусков
 * (pen, id-card, qr, package, stamp).
 *
 * Заливка используется только там, где форма важнее контура.
 */
const ICONS: Record<string, ReactNode> = {
  /* ── Навигация ───────────────────────────────────────── */
  dashboard: (
    <>
      <rect x="2.4" y="2.4" width="5" height="6.2" rx="0.9" />
      <rect x="8.6" y="2.4" width="5" height="3.6" rx="0.9" />
      <rect x="2.4" y="9.8" width="5" height="3.8" rx="0.9" />
      <rect x="8.6" y="7.2" width="5" height="6.4" rx="0.9" />
    </>
  ),
  calendar: (
    <>
      <rect x="2.3" y="3.6" width="11.4" height="10.1" rx="1.2" />
      <path d="M2.3 6.6h11.4M5.4 2.2v2.8M10.6 2.2v2.8" />
    </>
  ),
  'calendar-x': (
    <>
      <rect x="2.3" y="3.6" width="11.4" height="10.1" rx="1.2" />
      <path d="M2.3 6.6h11.4M5.4 2.2v2.8M10.6 2.2v2.8" />
      <path d="M6.4 9.3l3.2 3.2M9.6 9.3l-3.2 3.2" />
    </>
  ),
  'calendar-check': (
    <>
      <rect x="2.3" y="3.6" width="11.4" height="10.1" rx="1.2" />
      <path d="M2.3 6.6h11.4M5.4 2.2v2.8M10.6 2.2v2.8" />
      <path d="M6 10.6l1.5 1.5 3-3" />
    </>
  ),
  building: (
    <>
      <path d="M3.2 13.8V3.4a1 1 0 0 1 1-1h5.4a1 1 0 0 1 1 1v10.4" />
      <path d="M10.6 6.8h2a1 1 0 0 1 1 1v6" />
      <path d="M2 13.8h12" />
      <path d="M5.6 5.4h1M8.2 5.4h1M5.6 8h1M8.2 8h1M5.6 10.6h1M8.2 10.6h1" />
    </>
  ),
  contract: (
    <>
      <path d="M4.2 2.2h4.6l3 3v8.6H4.2z" />
      <path d="M8.7 2.2v3.1h3.1M6.2 8.6h3.6M6.2 11h2.6" />
    </>
  ),
  chart: (
    <>
      <path d="M2.4 13.4h11.2" />
      <path d="M4.8 13.4V9.2M8 13.4V5.4M11.2 13.4V7.4" />
    </>
  ),
  list: (
    <>
      <path d="M5.6 4h8M5.6 8h8M5.6 12h8" />
      <path d="M2.8 4h.6M2.8 8h.6M2.8 12h.6" />
    </>
  ),
  sliders: (
    <>
      <path d="M2.6 4.4h10.8M2.6 8h10.8M2.6 11.6h10.8" />
      <circle cx="6" cy="4.4" r="1.5" />
      <circle cx="10.4" cy="8" r="1.5" />
      <circle cx="5.2" cy="11.6" r="1.5" />
    </>
  ),
  shield: (
    <>
      <path d="M8 2.1l4.8 1.9v3.6c0 3-2 5.3-4.8 6.3-2.8-1-4.8-3.3-4.8-6.3V4z" />
      <path d="M6.1 8.1l1.4 1.4 2.6-2.7" />
    </>
  ),

  /* ── Пользователи ────────────────────────────────────── */
  user: (
    <>
      <circle cx="8" cy="5.6" r="2.6" />
      <path d="M3.4 13.6a4.6 4.6 0 0 1 9.2 0" />
    </>
  ),
  'user-circle': (
    <>
      <circle cx="8" cy="8" r="6" />
      <circle cx="8" cy="6.4" r="2" />
      <path d="M4.3 13a4.3 4.3 0 0 1 7.4 0" />
    </>
  ),
  users: (
    <>
      <circle cx="6.2" cy="5.6" r="2.4" />
      <path d="M2.2 13.4a4 4 0 0 1 8 0" />
      <path d="M10.6 3.6a2.4 2.4 0 0 1 0 4M11.4 9.8a4 4 0 0 1 2.4 3.6" />
    </>
  ),
  'id-card': (
    <>
      <rect x="1.8" y="3.4" width="12.4" height="9.2" rx="1.2" />
      <circle cx="5.6" cy="7.4" r="1.5" />
      <path d="M3.4 11.2a2.4 2.4 0 0 1 4.4 0" />
      <path d="M9.6 6.6h3M9.6 9.2h3" />
    </>
  ),

  /* ── Статусы ─────────────────────────────────────────── */
  'circle-dashed': (
    <>
      <path d="M6.1 2.5a5.8 5.8 0 0 0-2.6 1.9M2.4 6.6a5.8 5.8 0 0 0 0 2.8M3.5 11.6a5.8 5.8 0 0 0 2.6 1.9M9.9 13.5a5.8 5.8 0 0 0 2.6-1.9M13.6 9.4a5.8 5.8 0 0 0 0-2.8M12.5 4.4a5.8 5.8 0 0 0-2.6-1.9" />
    </>
  ),
  circle: <circle cx="8" cy="8" r="5.6" />,
  'circle-dot': (
    <>
      <circle cx="8" cy="8" r="5.6" />
      <circle cx="8" cy="8" r="1.8" fill="currentColor" stroke="none" />
    </>
  ),
  clock: (
    <>
      <circle cx="8" cy="8" r="5.8" />
      <path d="M8 4.7V8l2.3 1.5" />
    </>
  ),
  check: <path d="M3.2 8.4l3.2 3.2 6.4-7" />,
  'check-double': (
    <>
      <path d="M1.8 8.6l2.6 2.6 5-5.6" />
      <path d="M7.4 10.6l1 1 5.8-6.4" />
    </>
  ),
  'check-circle': (
    <>
      <circle cx="8" cy="8" r="5.8" />
      <path d="M5.4 8.2l1.9 1.9 3.4-3.9" />
    </>
  ),
  'alert-triangle': (
    <>
      <path d="M8 2.6l5.6 9.8H2.4z" />
      <path d="M8 6.6v2.8" />
      <circle cx="8" cy="11" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
  'alert-circle': (
    <>
      <circle cx="8" cy="8" r="5.8" />
      <path d="M8 5.1v3.4" />
      <circle cx="8" cy="10.7" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
  info: (
    <>
      <circle cx="8" cy="8" r="5.8" />
      <path d="M8 7.4v3.4" />
      <circle cx="8" cy="5.3" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
  'x-circle': (
    <>
      <circle cx="8" cy="8" r="5.8" />
      <path d="M6.1 6.1l3.8 3.8M9.9 6.1l-3.8 3.8" />
    </>
  ),
  ban: (
    <>
      <circle cx="8" cy="8" r="5.8" />
      <path d="M3.9 3.9l8.2 8.2" />
    </>
  ),

  /* ── Действия ────────────────────────────────────────── */
  x: <path d="M3.8 3.8l8.4 8.4M12.2 3.8l-8.4 8.4" />,
  plus: <path d="M8 3.2v9.6M3.2 8h9.6" />,
  minus: <path d="M3.2 8h9.6" />,
  search: (
    <>
      <circle cx="7.2" cy="7.2" r="4.4" />
      <path d="M10.5 10.5l3 3" />
    </>
  ),
  filter: <path d="M2.4 3.6h11.2l-4.3 5v4.4l-2.6-1.4V8.6z" />,
  download: (
    <>
      <path d="M8 2.6v7.2" />
      <path d="M5 7l3 3 3-3" />
      <path d="M2.8 12.6h10.4" />
    </>
  ),
  upload: (
    <>
      <path d="M8 10.4V3.2" />
      <path d="M5 6.2l3-3 3 3" />
      <path d="M2.8 12.8h10.4" />
    </>
  ),
  pencil: (
    <>
      <path d="M10.6 2.8l2.6 2.6-7.5 7.5-3.3.7.7-3.3z" />
      <path d="M9.2 4.2l2.6 2.6" />
    </>
  ),
  pen: (
    <>
      <path d="M2.6 13.4l1-3 6.6-6.6 2 2-6.6 6.6z" />
      <path d="M10.2 3.8l1.4-1.4 2 2-1.4 1.4" />
      <path d="M2.6 13.4h5" />
    </>
  ),
  stamp: (
    <>
      <path d="M4.4 13.4h7.2" />
      <path d="M3.6 11.2h8.8v1.2H3.6z" />
      <path d="M5.6 11.2V8.6a1 1 0 0 0-.5-.9 2.6 2.6 0 0 1-1.2-2.2 3.6 3.6 0 0 1 7.2 0 2.6 2.6 0 0 1-1.2 2.2 1 1 0 0 0-.5.9v2.6" />
    </>
  ),
  trash: (
    <>
      <path d="M2.8 4.4h10.4" />
      <path d="M4.4 4.4l.7 8.2a1 1 0 0 0 1 .8h3.8a1 1 0 0 0 1-.8l.7-8.2" />
      <path d="M6.2 4.4V3a.8.8 0 0 1 .8-.8h2a.8.8 0 0 1 .8.8v1.4" />
    </>
  ),
  eye: (
    <>
      <path d="M1.6 8s2.4-4.2 6.4-4.2S14.4 8 14.4 8s-2.4 4.2-6.4 4.2S1.6 8 1.6 8z" />
      <circle cx="8" cy="8" r="1.9" />
    </>
  ),
  paperclip: (
    <path d="M11.6 7.4l-4.5 4.5a2.6 2.6 0 0 1-3.7-3.7l5.4-5.4a1.8 1.8 0 0 1 2.5 2.5l-5.3 5.3a.9.9 0 0 1-1.3-1.3l4.6-4.6" />
  ),
  refresh: (
    <>
      <path d="M13.2 7.2a5.4 5.4 0 0 0-9.4-2.6L2.4 6" />
      <path d="M2.8 8.8a5.4 5.4 0 0 0 9.4 2.6l1.4-1.4" />
      <path d="M2.4 2.8V6h3.2M13.6 13.2V10h-3.2" />
    </>
  ),
  loader: (
    <>
      <path d="M8 2.2v2.6M8 11.2v2.6M13.8 8h-2.6M4.8 8H2.2" />
      <path d="M12.1 3.9l-1.8 1.8M5.7 10.3l-1.8 1.8M12.1 12.1l-1.8-1.8M5.7 5.7L3.9 3.9" />
    </>
  ),
  'log-out': (
    <>
      <path d="M6.2 13.4H3.6a1 1 0 0 1-1-1V3.6a1 1 0 0 1 1-1h2.6" />
      <path d="M10.2 11L13.4 8l-3.2-3" />
      <path d="M13.4 8H6" />
    </>
  ),
  lock: (
    <>
      <rect x="3.4" y="7" width="9.2" height="6.4" rx="1.2" />
      <path d="M5.6 7V5.2a2.4 2.4 0 0 1 4.8 0V7" />
    </>
  ),
  bell: (
    <>
      <path d="M4.2 7a3.8 3.8 0 0 1 7.6 0c0 3 1.2 3.8 1.2 3.8H3s1.2-.8 1.2-3.8z" />
      <path d="M6.8 12.8a1.4 1.4 0 0 0 2.4 0" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="3.6" width="12" height="8.8" rx="1.2" />
      <path d="M2.4 4.6l5.6 4 5.6-4" />
    </>
  ),
  phone: (
    <path d="M5.2 2.6l1.6 3-1.4 1.4a8 8 0 0 0 3.6 3.6l1.4-1.4 3 1.6v2.2a1 1 0 0 1-1.1 1A11.4 11.4 0 0 1 2.2 3.7a1 1 0 0 1 1-1.1z" />
  ),
  'map-pin': (
    <>
      <path d="M8 13.8s4.4-3.6 4.4-7A4.4 4.4 0 0 0 3.6 6.8c0 3.4 4.4 7 4.4 7z" />
      <circle cx="8" cy="6.6" r="1.7" />
    </>
  ),
  inbox: (
    <>
      <rect x="2" y="2.8" width="12" height="10.4" rx="1.2" />
      <path d="M2 9.4h3.2l1 1.6h3.6l1-1.6H14" />
    </>
  ),
  box: (
    <>
      <path d="M8 2.2l5.6 2.8v6L8 13.8 2.4 11V5z" />
      <path d="M2.4 5L8 7.8 13.6 5M8 7.8v6" />
    </>
  ),
  package: (
    <>
      <path d="M8 2.2l5.6 2.8v6L8 13.8 2.4 11V5z" />
      <path d="M2.4 5L8 7.8 13.6 5M8 7.8v6M5.2 3.6l5.6 2.8" />
    </>
  ),
  qr: (
    <>
      <rect x="2.4" y="2.4" width="4.4" height="4.4" rx="0.8" />
      <rect x="9.2" y="2.4" width="4.4" height="4.4" rx="0.8" />
      <rect x="2.4" y="9.2" width="4.4" height="4.4" rx="0.8" />
      <path d="M9.2 9.2h1.8v1.8H9.2zM12.4 9.2h1.2M9.2 12.4h1.8M12.4 12v1.6M13.6 10.8v.1" />
    </>
  ),
  file: (
    <>
      <path d="M4.2 2.2h4.6l3 3v8.6H4.2z" />
      <path d="M8.7 2.2v3.1h3.1" />
    </>
  ),
  'file-text': (
    <>
      <path d="M4.2 2.2h4.6l3 3v8.6H4.2z" />
      <path d="M8.7 2.2v3.1h3.1M6.2 8.6h3.6M6.2 11h2.6" />
    </>
  ),
  table: (
    <>
      <rect x="2.2" y="3" width="11.6" height="10" rx="1.1" />
      <path d="M2.2 6.4h11.6M6.4 6.4V13" />
    </>
  ),

  /* ── Стрелки и раскрытие ─────────────────────────────── */
  'panel-left': (
    <>
      <rect x="2.2" y="3" width="11.6" height="10" rx="1.1" />
      <path d="M6.4 3v10" />
    </>
  ),
  'chevron-down': <path d="M4 6.2l4 4 4-4" />,
  'chevron-up': <path d="M4 9.8l4-4 4 4" />,
  'chevron-right': <path d="M6.2 3.6l4.4 4.4-4.4 4.4" />,
  'chevron-left': <path d="M9.8 3.6L5.4 8l4.4 4.4" />,
  'chevrons-left': <path d="M7.6 3.8L3.4 8l4.2 4.2M12.4 3.8L8.2 8l4.2 4.2" />,
  'chevrons-right': <path d="M8.4 3.8L12.6 8l-4.2 4.2M3.6 3.8L7.8 8l-4.2 4.2" />,
  'arrow-up': <path d="M8 12.8V3.4M4.2 7.2L8 3.4l3.8 3.8" />,
  'arrow-down': <path d="M8 3.2v9.4M4.2 8.8L8 12.6l3.8-3.8" />,
  'arrow-right': <path d="M3.2 8h9.4M8.8 4.2L12.6 8l-3.8 3.8" />,
  'arrow-left': <path d="M12.8 8H3.4M7.2 4.2L3.4 8l3.8 3.8" />,
  'more-horizontal': (
    <>
      <circle cx="4" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
    </>
  ),

  /* ── Прочее ──────────────────────────────────────────── */
  sun: (
    <>
      <circle cx="8" cy="8" r="3.1" />
      <path d="M8 1.6v1.6M8 12.8v1.6M14.4 8h-1.6M3.2 8H1.6M12.5 3.5l-1.1 1.1M4.6 11.4l-1.1 1.1M12.5 12.5l-1.1-1.1M4.6 4.6L3.5 3.5" />
    </>
  ),
  moon: <path d="M13.2 9.6A5.8 5.8 0 0 1 6.4 2.8a5.8 5.8 0 1 0 6.8 6.8z" />,
  globe: (
    <>
      <circle cx="8" cy="8" r="5.8" />
      <path d="M2.4 8h11.2" />
      <path d="M8 2.2a9 9 0 0 1 0 11.6A9 9 0 0 1 8 2.2z" />
    </>
  ),
  zap: <path d="M8.8 1.8L3.6 9h3.6l-.8 5.2L12.4 7H8.8z" />,
  activity: <path d="M1.8 8h3l2-5 3 10 2-5h2.4" />,
  'external-link': (
    <>
      <path d="M9.4 2.6h4v4" />
      <path d="M13.4 2.6l-5.6 5.6" />
      <path d="M11.6 9v3.2a1.2 1.2 0 0 1-1.2 1.2H3.8a1.2 1.2 0 0 1-1.2-1.2V5.6a1.2 1.2 0 0 1 1.2-1.2H7" />
    </>
  ),
}

export type IconName = keyof typeof ICONS

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: string
  size?: number
  strokeWidth?: number
}

export function Icon({ name, size = 16, strokeWidth = 1.6, className, ...rest }: IconProps) {
  const glyph = ICONS[name]
  if (!glyph) return null

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', className)}
      {...rest}
    >
      {glyph}
    </svg>
  )
}

export default Icon
