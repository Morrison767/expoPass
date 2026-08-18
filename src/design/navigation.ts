import type { Role } from '@/lib/types'

/**
 * СТРУКТУРА НАВИГАЦИИ. Пункты фильтруются по активной роли:
 * `roles: 'all'` — виден всем авторизованным, иначе перечисление ролей.
 */
export interface NavItem {
  key: string
  label: string
  path: string
  icon: string
  roles: Role[] | 'all'
  /** Ключ счётчика очереди — вычисляется в рантайме из стора */
  counter?: 'object_admin_queue' | 'goc_queue' | 'my_active' | 'pending_registrations'
}

export interface NavGroup {
  key: string
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'main',
    label: 'Рабочая область',
    items: [
      { key: 'dashboard', label: 'Главная', path: '/dashboard', icon: 'dashboard', roles: 'all' },
      {
        key: 'profile',
        label: 'Профиль',
        path: '/profile',
        icon: 'user-circle',
        roles: 'all',
      },
      {
        key: 'applications',
        label: 'Мои заявки',
        path: '/applications',
        icon: 'file-text',
        roles: ['user', 'super_admin'],
        counter: 'my_active',
      },
    ],
  },
  {
    key: 'process',
    label: 'Согласование и регистрация',
    items: [
      {
        key: 'object-admin-queue',
        label: 'Заявки на согласование',
        path: '/object-admin/queue',
        icon: 'clock',
        roles: ['object_admin', 'super_admin'],
        counter: 'object_admin_queue',
      },
      {
        key: 'goc-queue',
        label: 'Заявки на регистрацию',
        path: '/goc/queue',
        icon: 'stamp',
        roles: ['goc_officer', 'super_admin'],
        counter: 'goc_queue',
      },
      {
        key: 'registry',
        label: 'Реестр',
        path: '/registry',
        icon: 'table',
        roles: ['goc_officer', 'super_admin', 'account_admin', 'auditor', 'object_admin'],
      },
    ],
  },
  {
    key: 'admin',
    label: 'Администрирование',
    items: [
      {
        key: 'registrations',
        label: 'Регистрации',
        path: '/admin/registrations',
        icon: 'user-circle',
        roles: ['super_admin', 'account_admin'],
        counter: 'pending_registrations',
      },
      {
        key: 'users',
        label: 'Пользователи',
        path: '/admin/users',
        icon: 'users',
        roles: ['super_admin', 'account_admin'],
      },
      {
        key: 'objects',
        label: 'Объекты',
        path: '/admin/objects',
        icon: 'building',
        roles: ['super_admin', 'account_admin'],
      },
    ],
  },
]

/** Разделы, доступные активной роли */
export function navForRole(role: Role | null): NavGroup[] {
  if (!role) return []
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles === 'all' || item.roles.includes(role)),
  })).filter((group) => group.items.length > 0)
}

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items)

/** Крошки: наиболее длинный совпадающий префикс пути */
export function navItemByPath(path: string): NavItem | undefined {
  return ALL_NAV_ITEMS.filter((item) => path === item.path || path.startsWith(`${item.path}/`)).sort(
    (a, b) => b.path.length - a.path.length,
  )[0]
}
