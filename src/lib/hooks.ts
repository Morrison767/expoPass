'use client'

import { useEffect, useRef } from 'react'

/**
 * Закрытие всплывающего слоя по клику вне и по Escape.
 * Используется выпадающими списками топбара и фильтрами реестров.
 */
export function useOutsideClick<T extends HTMLElement = HTMLDivElement>(
  handler: () => void,
  active: boolean,
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!active) return

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) handler()
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') handler()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [active, handler])

  return ref
}
