import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/icon'
import { Plate } from '@/components/ui/badge'

/**
 * Заголовок страницы под топбаром: иконка раздела, название, действия.
 * Используется всеми экранами для единого вертикального ритма.
 */
export function PageHeader({
  icon,
  title,
  plate,
  subtitle,
  actions,
  tabs,
  className,
}: {
  icon?: string
  title: string
  plate?: string
  subtitle?: ReactNode
  actions?: ReactNode
  tabs?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('border-b border-hairline bg-surface', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pb-3.5 pt-4 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon ? (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-accent-line bg-accent-soft text-accent-fg shadow-bevel">
                <Icon name={icon} size={15} />
              </span>
            ) : null}
            <h1 className="min-w-0 truncate text-2xl font-semibold leading-tight text-content">
              {title}
            </h1>
            {plate ? <Plate className="mt-0.5">{plate}</Plate> : null}
          </div>
          {subtitle ? (
            <div className="mt-1 max-w-3xl text-base text-content-subtle">{subtitle}</div>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {tabs ? <div className="px-4 sm:px-5">{tabs}</div> : null}
    </div>
  )
}

/** Обёртка содержимого страницы — единые поля и максимальная ширина */
export function PageBody({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={cn('px-4 py-4 sm:px-5 sm:py-5', className)}>{children}</div>
}

/**
 * Заглушка нереализованного раздела. Прототип покрывает Этап 1,
 * поэтому разделы Этапов 2–3 честно помечены как предстоящие.
 */
export function StagePlaceholder({
  title,
  stage,
  description,
  icon = 'layers',
}: {
  title: string
  stage: number
  description?: string
  icon?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-hairline bg-surface-sunken text-content-faint shadow-bevel">
        <Icon name={icon} size={22} />
      </span>
      <div>
        <h2 className="text-xl font-semibold text-content">{title}</h2>
        <p className="mt-1 text-md text-content-subtle">Раздел в разработке — Этап {stage}</p>
      </div>
      {description ? (
        <p className="max-w-md text-base leading-relaxed text-content-faint">{description}</p>
      ) : null}
    </div>
  )
}
