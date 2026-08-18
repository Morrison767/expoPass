/**
 * ДИЗАЙН-ТОКЕНЫ QazExpoPass.
 *
 * Перенесены из действующего проекта Общества (ИС учёта мероприятий
 * QazExpoCongress) — оба сервиса должны читаться как одна система.
 * Источник правды: импортируется в tailwind.config.ts и в рантайм там,
 * где нужно значение цвета в JS (свечение статусной кромки).
 *
 * Не хардкодьте hex в компонентах — только Tailwind-классы или этот файл.
 */

/* ── 1. АКЦЕНТ-СТРУКТУРА «Ink Navy» — тон навигационных табло комплекса ── */
export const navy = {
  50: '#F1F4FA',
  100: '#E1E8F4',
  200: '#C4D2E8',
  300: '#93A9CE',
  400: '#5B79AC',
  500: '#2F5490',
  600: '#1B3A6B', // ← основной акцент, primary-кнопки
  700: '#17325C',
  800: '#12274A',
  900: '#0D1D38',
  950: '#081326',
}

/* ── 2. КОРПУС «Obsidian» — сайдбар, топбар, шапки панелей ── */
export const obsidian = {
  950: '#050910',
  900: '#080D14',
  850: '#0B1219',
  800: '#0E1620',
  700: '#16202C',
  600: '#1F2C3A',
  500: '#2C3B4D',
  400: '#5A6E82',
  300: '#6D8296',
  200: '#94A7B8',
  100: '#C7D5E0',
  50: '#E8EEF4',
}

/* ── 3. СВЕТ «Beam Cyan» — активный пункт, фокус, индикаторы. Только линии ── */
export const beam = {
  50: '#EDFCFF',
  100: '#D3F6FD',
  200: '#A8EDFA',
  300: '#6FE1F5',
  400: '#35D6F0',
  500: '#17BCD8',
  600: '#0F97B0',
  700: '#0B7C93', // тот же свет, доведённый до AA на белом
  800: '#0D6375',
  900: '#114F5E',
}

/* ── 4. СИГНАЛЬНЫЙ АКЦЕНТ «Signal Amber» — требует внимания ── */
export const signal = {
  50: '#FFF8EB',
  100: '#FDECC8',
  200: '#FBD891',
  300: '#F8BE55',
  400: '#F5A524',
  500: '#EF9006',
  600: '#D97706',
  700: '#B45309',
  800: '#92400E',
  900: '#78350F',
}

/* ── 5. НЕЙТРАЛЬНАЯ ШКАЛА «Ink» — холодный серый с синим подтоном ── */
export const ink = {
  25: '#FAFBFC',
  50: '#F5F6F8',
  100: '#EDEFF3',
  200: '#DFE3EA',
  300: '#C7CDD8',
  400: '#98A1B2',
  500: '#6B7688',
  600: '#4E5868',
  700: '#38414F',
  800: '#232B38',
  900: '#101B2D',
  950: '#0A121F',
}

/**
 * ── 6. ПАЛИТРА СТАТУСОВ — 8 токенов ──
 * Каждый статус несёт base / soft / border / text / glow.
 * ВАЖНО: цвет никогда не единственный носитель смысла — бейдж всегда
 * = цвет + иконка-форма + текстовая метка (см. design/statuses.ts).
 */
export const status = {
  /** Черновик — заявка не отправлена */
  draft: {
    base: '#64748B',
    soft: '#F1F3F7',
    border: '#D5DAE3',
    text: '#455065',
    glow: 'rgba(100, 116, 139, 0.45)',
  },
  /** На согласовании — ожидает решения ответственного */
  review: {
    base: '#D97706',
    soft: '#FEF6E7',
    border: '#F7DCA9',
    text: '#8F4B0B',
    glow: 'rgba(217, 119, 6, 0.5)',
  },
  /** Действует — пропуск зарегистрирован */
  confirmed: {
    base: '#0D9488',
    soft: '#E6F7F5',
    border: '#A9DFD9',
    text: '#0B5F58',
    glow: 'rgba(13, 148, 136, 0.5)',
  },
  /** Отклонена */
  conflict: {
    base: '#DC2626',
    soft: '#FEECEC',
    border: '#F6BFBF',
    text: '#A31818',
    glow: 'rgba(220, 38, 38, 0.55)',
  },
  /** Согласована, передана дальше по маршруту */
  paid: {
    base: '#0284C7',
    soft: '#E7F4FC',
    border: '#AFD8F0',
    text: '#075985',
    glow: 'rgba(2, 132, 199, 0.5)',
  },
  /** Возвращена на доработку */
  unpaid: {
    base: '#EA580C',
    soft: '#FEF0E8',
    border: '#F8CBAE',
    text: '#9A3412',
    glow: 'rgba(234, 88, 12, 0.5)',
  },
  /** Истекла — срок действия завершён */
  done: {
    base: '#7C3AED',
    soft: '#F2ECFE',
    border: '#D6C6FA',
    text: '#5B21B6',
    glow: 'rgba(124, 58, 237, 0.5)',
  },
  /** Аннулирована */
  void: {
    base: '#9F1239',
    soft: '#FCEAEF',
    border: '#F0BECD',
    text: '#831231',
    glow: 'rgba(159, 18, 57, 0.5)',
  },
}

export type StatusToken = keyof typeof status

/** Шкала для деструктивных действий */
export const danger = {
  50: '#FEF2F2',
  100: '#FEE2E2',
  200: '#FECACA',
  300: '#FCA5A5',
  400: '#F87171',
  500: '#EF4444',
  600: '#DC2626',
  700: '#B91C1C',
  800: '#991B1B',
  900: '#7F1D1D',
}

export const success = {
  50: '#ECFDF5',
  100: '#D1FAE5',
  200: '#A7F3D0',
  300: '#6EE7B7',
  400: '#34D399',
  500: '#10B981',
  600: '#047857',
  700: '#065F46',
  800: '#064E3B',
  900: '#022C22',
}

/**
 * ── 7. ТИПОГРАФИКА ──
 * IBM Plex Sans — кириллица-native, инженерный характер, читаемость на 13px.
 * IBM Plex Mono — машинные идентификаторы: номера пропусков, коды объектов.
 */
export const fontFamily = {
  sans: [
    'var(--font-plex-sans)',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    'Arial',
    'sans-serif',
  ],
  mono: [
    'var(--font-plex-mono)',
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Consolas',
    'monospace',
  ],
}

/** Плотная шкала: базовый размер интерфейса — 13px */
export const fontSize = {
  '2xs': ['0.625rem', { lineHeight: '0.875rem', letterSpacing: '0.06em' }], //   10/14 — CAPS-метки
  xs: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.01em' }], //         11/16 — подписи, хинты
  sm: ['0.75rem', { lineHeight: '1.125rem' }], //                               12/18 — плотные таблицы
  base: ['0.8125rem', { lineHeight: '1.25rem' }], //                            13/20 — ОСНОВНОЙ размер
  md: ['0.875rem', { lineHeight: '1.3125rem' }], //                             14/21 — тело карточек
  lg: ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.006em' }], //          16/24 — заголовок карточки
  xl: ['1.125rem', { lineHeight: '1.625rem', letterSpacing: '-0.01em' }], //     18/26 — заголовок панели
  '2xl': ['1.375rem', { lineHeight: '1.875rem', letterSpacing: '-0.014em' }], // 22/30 — заголовок страницы
  '3xl': ['1.75rem', { lineHeight: '2.125rem', letterSpacing: '-0.02em' }], //   28/34
  '4xl': ['2.125rem', { lineHeight: '2.375rem', letterSpacing: '-0.024em' }], // 34/38
  '5xl': ['2.75rem', { lineHeight: '2.875rem', letterSpacing: '-0.03em' }], //   44/46 — приборные числа
  '6xl': ['3.5rem', { lineHeight: '3.5rem', letterSpacing: '-0.034em' }],
}

export const fontWeight = { normal: '400', medium: '500', semibold: '600', bold: '700' }

/* ── 8. ОТСТУПЫ — сетка 4px ── */
export const spacing = {
  0.5: '0.125rem',
  1.5: '0.375rem',
  2.5: '0.625rem',
  3.5: '0.875rem',
  4.5: '1.125rem',
  5.5: '1.375rem',
  7.5: '1.875rem',
  13: '3.25rem',
  15: '3.75rem',
  17: '4.25rem',
  18: '4.5rem',
  22: '5.5rem',
  rail: '0.1875rem', // 3 — толщина светящейся кромки
}

/** Фиксированные размеры каркаса и контролов */
export const sizes = {
  'control-sm': '1.75rem', //        28
  control: '2rem', //                32 — базовая высота контрола
  'control-lg': '2.375rem', //       38
  topbar: '3.5rem', //               56
  row: '2.25rem', //                 36
  'row-lg': '2.75rem', //            44
  sidebar: '15.5rem', //            248
  'sidebar-collapsed': '3.75rem', // 60
  'panel-md': '30rem',
  'panel-lg': '40rem',
}

/* ── 9. РАДИУСЫ — сдержанные. Институциональный тон, не «пилюли» ── */
export const borderRadius = {
  none: '0',
  xs: '2px',
  sm: '3px',
  DEFAULT: '4px', // контролы, бейджи
  md: '6px', //      карточки, таблицы
  lg: '8px', //      модальные окна, панели
  xl: '12px',
  '2xl': '16px',
  full: '9999px',
}

export const zIndex = {
  base: '0',
  sticky: '30',
  dropdown: '40',
  overlay: '50',
  modal: '60',
  toast: '70',
}

/* ── 10. ДВИЖЕНИЕ ── */
export const motion = {
  duration: {
    instant: '80ms',
    fast: '120ms',
    base: '180ms',
    slow: '260ms',
    slower: '380ms',
  },
  easing: {
    decelerate: 'cubic-bezier(0.16, 1, 0.3, 1)',
    spring: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  },
}
