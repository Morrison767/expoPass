'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from './header'
import { Sidebar, MobileNav } from './sidebar'
import { useAppStore } from '@/store/app-store'
import { Icon } from '@/components/ui/icon'
import { Toaster } from '@/components/ui/toast'

/**
 * КАРКАС ЗАЩИЩЁННОЙ ЧАСТИ: топбар + сайдбар + рабочая поверхность.
 *
 * Здесь же — «сторож» маршрута: без авторизации пользователь
 * отправляется на /login. Стор восстанавливается из localStorage
 * асинхронно, поэтому до гидратации показываем нейтральную заглушку,
 * иначе первый кадр моргнёт редиректом.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const currentUserId = useAppStore((s) => s.currentUserId)
  const theme = useAppStore((s) => s.theme)
  const refreshExpired = useAppStore((s) => s.refreshExpired)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // persist восстанавливает состояние после монтирования
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true))
    if (useAppStore.persist.hasHydrated()) setHydrated(true)
    return unsub
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!hydrated) return
    if (!currentUserId) {
      router.replace('/login')
      return
    }
    // Пропуска с прошедшей датой переводятся в статус «Истекла»
    refreshExpired()
  }, [hydrated, currentUserId, router, refreshExpired])

  if (!hydrated || !currentUserId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <span className="flex items-center gap-2 text-base text-content-faint">
          <Icon name="loader" size={16} className="animate-spin" />
          Загрузка сервиса…
        </span>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas">
      <Header />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
      <MobileNav />
      <Toaster />
    </div>
  )
}
