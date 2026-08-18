'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { cn } from '@/lib/cn'
import { Icon } from './icon'

/** Чекбокс: квадрат 16px, акцентная заливка, фокус-луч */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(function Checkbox({ className, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'focus-ring peer h-4 w-4 shrink-0 rounded-xs border border-hairline-strong bg-surface transition-all duration-fast',
        'hover:border-content-faint',
        'data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-content-inverse',
        'disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Icon name="check" size={11} strokeWidth={2.4} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})

export { Checkbox }
