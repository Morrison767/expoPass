import type { Config } from 'tailwindcss'
import {
  navy,
  obsidian,
  beam,
  signal,
  ink,
  danger,
  success,
  fontFamily,
  fontSize,
  fontWeight,
  spacing,
  sizes,
  borderRadius,
  zIndex,
  motion,
} from './src/design/tokens'

/**
 * Цвет в системе делится на два слоя:
 *
 *  1. СЕМАНТИЧЕСКИЕ токены — var(--…), переключаются темой.
 *     Компоненты используют только их: bg-surface, text-content,
 *     border-hairline, bg-nav-raised, text-accent-fg, bg-status-*-soft.
 *
 *  2. СЫРЫЕ шкалы — статичные hex (navy, beam, ink, obsidian, signal…).
 *     Только там, где нужен фиксированный оттенок независимо от темы.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        /* ── Семантика: поверхности ── */
        canvas: 'var(--canvas)',
        surface: {
          DEFAULT: 'var(--surface)',
          sunken: 'var(--surface-sunken)',
          muted: 'var(--surface-muted)',
          inverse: 'var(--surface-inverse)',
        },
        /* ── Семантика: каркас ── */
        nav: {
          DEFAULT: 'var(--nav)',
          raised: 'var(--nav-raised)',
          sunken: 'var(--nav-sunken)',
          hover: 'var(--nav-hover)',
          active: 'var(--nav-active)',
          fg: 'var(--nav-fg)',
          muted: 'var(--nav-muted)',
          subtle: 'var(--nav-subtle)',
          faint: 'var(--nav-faint)',
          line: 'var(--nav-line)',
        },
        /* ── Семантика: границы ── */
        hairline: {
          DEFAULT: 'var(--hairline)',
          soft: 'var(--hairline-soft)',
          strong: 'var(--hairline-strong)',
        },
        /* ── Семантика: текст ── */
        content: {
          DEFAULT: 'var(--content)',
          muted: 'var(--content-muted)',
          subtle: 'var(--content-subtle)',
          faint: 'var(--content-faint)',
          inverse: 'var(--content-inverse)',
        },
        /* ── Семантика: акцент-свет ── */
        accent: {
          DEFAULT: 'var(--accent)',
          fg: 'var(--accent-fg)',
          strong: 'var(--accent-strong)',
          soft: 'var(--accent-soft)',
          line: 'var(--accent-line)',
        },
        /* ── Семантика: primary ── */
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          active: 'var(--primary-active)',
          line: 'var(--primary-line)',
          fg: 'var(--primary-fg)',
        },
        overlay: 'var(--overlay)',
        /* ── Семантика: статусы ── */
        status: {
          draft: {
            base: 'var(--st-draft)',
            soft: 'var(--st-draft-soft)',
            border: 'var(--st-draft-line)',
            text: 'var(--st-draft-fg)',
          },
          review: {
            base: 'var(--st-review)',
            soft: 'var(--st-review-soft)',
            border: 'var(--st-review-line)',
            text: 'var(--st-review-fg)',
          },
          confirmed: {
            base: 'var(--st-confirmed)',
            soft: 'var(--st-confirmed-soft)',
            border: 'var(--st-confirmed-line)',
            text: 'var(--st-confirmed-fg)',
          },
          conflict: {
            base: 'var(--st-conflict)',
            soft: 'var(--st-conflict-soft)',
            border: 'var(--st-conflict-line)',
            text: 'var(--st-conflict-fg)',
          },
          paid: {
            base: 'var(--st-paid)',
            soft: 'var(--st-paid-soft)',
            border: 'var(--st-paid-line)',
            text: 'var(--st-paid-fg)',
          },
          unpaid: {
            base: 'var(--st-unpaid)',
            soft: 'var(--st-unpaid-soft)',
            border: 'var(--st-unpaid-line)',
            text: 'var(--st-unpaid-fg)',
          },
          done: {
            base: 'var(--st-done)',
            soft: 'var(--st-done-soft)',
            border: 'var(--st-done-line)',
            text: 'var(--st-done-fg)',
          },
          void: {
            base: 'var(--st-void)',
            soft: 'var(--st-void-soft)',
            border: 'var(--st-void-line)',
            text: 'var(--st-void-fg)',
          },
        },
        /* ── Сырые шкалы: фиксированный оттенок вне зависимости от темы ── */
        navy,
        obsidian,
        beam,
        signal,
        ink,
        danger,
        success,
      },
      fontFamily,
      fontSize: fontSize as Config['theme'],
      fontWeight,
      spacing: { ...spacing, ...sizes },
      width: sizes,
      height: sizes,
      minWidth: ({ theme }: { theme: (k: string) => object }) => ({ ...theme('spacing'), ...sizes }),
      minHeight: ({ theme }: { theme: (k: string) => object }) => ({ ...theme('spacing'), ...sizes }),
      maxWidth: ({ theme }: { theme: (k: string) => object }) => ({ ...theme('spacing'), ...sizes }),
      borderRadius,
      borderColor: { DEFAULT: 'var(--hairline)' },
      ringColor: { DEFAULT: 'var(--accent)' },
      ringOffsetColor: { DEFAULT: 'var(--surface)' },
      /* Тени — тоже семантика: тёмной теме нужны другие значения */
      boxShadow: {
        none: 'none',
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-base)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        panel: 'var(--shadow-panel)',
        bevel: 'var(--shadow-bevel)',
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        button: 'var(--shadow-button)',
        'button-quiet': 'var(--shadow-button-quiet)',
        plate: 'var(--shadow-plate)',
        beam: '0 0 0 1px var(--accent-glow-soft), 0 0 12px 0 var(--accent-glow-soft)',
        'beam-sm': '0 0 8px 0 var(--accent-glow-soft)',
        'beam-lg': '0 0 0 1px var(--accent-glow), 0 0 24px -2px var(--accent-glow)',
      },
      backgroundImage: {
        'surface-raised': 'var(--grad-surface)',
        'surface-nav': 'var(--grad-nav)',
        hero: 'var(--grad-hero)',
        bloom: 'var(--bloom)',
      },
      zIndex,
      letterSpacing: {
        // tracking-wide у ADATA — 0.025em; прежние 0.08–0.12em были
        // приёмом «приборной панели» и в новой системе неуместны
        plate: '0.025em',
        label: '0.025em',
      },
      transitionDuration: {
        instant: motion.duration.instant,
        fast: motion.duration.fast,
        DEFAULT: motion.duration.base,
        base: motion.duration.base,
        slow: motion.duration.slow,
        slower: motion.duration.slower,
      },
      transitionTimingFunction: {
        decelerate: motion.easing.decelerate,
        spring: motion.easing.spring,
        accelerate: motion.easing.accelerate,
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'translateY(-4px) scale(0.985)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in-up': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'reveal-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-beam': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in': `fade-in ${motion.duration.base} ${motion.easing.decelerate}`,
        'scale-in': `scale-in 200ms ${motion.easing.spring}`,
        'slide-in-up': `slide-in-up 240ms ${motion.easing.spring}`,
        'reveal-up': `reveal-up 340ms ${motion.easing.decelerate} both`,
        'pulse-beam': 'pulse-beam 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
