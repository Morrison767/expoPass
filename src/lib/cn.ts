import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Склейка классов. clsx принимает строки, массивы и объекты { class: boolean },
 * twMerge снимает конфликты Tailwind-утилит (нужен для варианта `className`
 * поверх пресетов компонента).
 * className из props всегда передавайте последним аргументом.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
