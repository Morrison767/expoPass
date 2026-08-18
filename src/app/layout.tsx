import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

/**
 * ШРИФТЫ — те же, что в ИС учёта мероприятий Общества.
 * IBM Plex Sans — кириллица-native, инженерно-институциональный характер,
 * читаемость на 13px. IBM Plex Mono — машинные идентификаторы: номера
 * пропусков, коды объектов, серийные номера ТМЦ.
 *
 * В старом проекте подключались через Google Fonts <link>; здесь —
 * next/font, чтобы файлы обслуживались с собственного домена.
 */
const plexSans = IBM_Plex_Sans({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-sans',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'QazExpoPass — электронные пропуска',
  description:
    'Информационный сервис АО «НК «QazExpoCongress» для оформления материальных пропусков на внос и вынос ТМЦ',
}

/**
 * Тема ставится до первой отрисовки: иначе на секунду мигнёт светлая.
 * Читаем из того же ключа, куда пишет persist-хранилище Zustand.
 */
const THEME_BOOTSTRAP = `
(function () {
  try {
    var raw = localStorage.getItem('qazexpopass-store')
    var saved = raw ? (JSON.parse(raw).state || {}).theme : null
    var system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', saved || system)
  } catch (e) {
    /* приватный режим — остаётся светлая тема по умолчанию */
  }
})()
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-theme="light" className={`${plexSans.variable} ${plexMono.variable}`}>
      <head>
        <meta name="theme-color" content="#1B3A6B" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#080D14" media="(prefers-color-scheme: dark)" />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
