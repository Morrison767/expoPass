/**
 * Прототип публикуется на GitHub Pages — статическом хостинге без
 * серверной среды. Поэтому сборка идёт в режиме экспорта: каждая страница
 * превращается в готовый HTML, а вся логика работает на клиенте.
 * Это допустимо, потому что бэкенда у прототипа нет: данные живут
 * в localStorage браузера.
 *
 * BASE_PATH задаётся workflow-ом деплоя: на Pages сайт лежит в подкаталоге
 * с именем репозитория, локально — в корне.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath,
  // Каталоги с index.html: Pages отдаёт их без переписывания адресов
  trailingSlash: true,
  // Оптимизатор изображений требует сервера, которого здесь нет
  images: { unoptimized: true },
}

export default nextConfig
