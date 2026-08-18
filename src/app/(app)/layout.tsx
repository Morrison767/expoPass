import { AppShell } from '@/components/layout/app-shell'

/** Группа защищённых маршрутов: всё внутри требует авторизации */
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
