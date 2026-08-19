import type { Metadata, Viewport } from 'next'
import { Open_Sans } from 'next/font/google'
import './globals.css'

/**
 * ШРИФТ.
 *
 * Open Sans — то же семейство, что в ADATA (взято из их layout.tsx).
 *
 * Моноширинный вебшрифт намеренно не подключается: ADATA использует
 * font-mono два десятка раз, но своего начертания не грузит — падает
 * на системный стек. Делаем так же. Плюс один шрифт меньше в загрузке,
 * и номера документов выглядят нейтральнее, чем в характерном
 * «программистском» начертании.
 */
const sans = Open_Sans({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'QazExpoPass — электронные пропуска',
  description:
    'Информационный сервис АО «НК «QazExpoCongress» для оформления материальных пропусков на внос и вынос ТМЦ',
}

/**
 * Настройки области просмотра.
 *
 * `maximumScale` намеренно не ограничен: запрет масштабирования мешает
 * людям со слабым зрением и нарушает доступность. Вместо этого поля
 * выставлены так, чтобы не приходилось увеличивать вручную.
 *
 * `viewportFit: 'cover'` разрешает контенту заходить под вырез экрана,
 * а безопасные отступы добавляются в каркасе через env(safe-area-inset-*).
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2474F5' },
    { media: '(prefers-color-scheme: dark)', color: '#0C121C' },
  ],
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
    <html lang="ru" data-theme="light" className={sans.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
