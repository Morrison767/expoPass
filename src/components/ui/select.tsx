'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { cn } from '@/lib/cn'
import { Icon } from './icon'

/** Select на Radix, одетый в геометрию контролов системы */
const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const TRIGGER_SIZES = {
  sm: 'h-control-sm rounded-sm px-2 text-xs',
  md: 'h-control rounded px-2.5 text-base',
  lg: 'h-control-lg rounded-md px-3 text-md',
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    size?: keyof typeof TRIGGER_SIZES
    invalid?: boolean
  }
>(function SelectTrigger({ className, children, size = 'md', invalid, ...props }, ref) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'focus-ring flex w-full items-center justify-between gap-2 border bg-surface text-content transition-all duration-fast',
        'hover:border-content-faint focus:border-accent focus:shadow-beam-sm focus:outline-none',
        'disabled:cursor-not-allowed disabled:border-hairline disabled:bg-surface-muted disabled:text-content-faint',
        'data-[placeholder]:text-content-faint',
        TRIGGER_SIZES[size],
        invalid ? 'border-status-conflict-border' : 'border-hairline-strong',
        className,
      )}
      {...props}
    >
      <span className="min-w-0 truncate text-left">{children}</span>
      <SelectPrimitive.Icon asChild>
        <Icon name="chevron-down" size={14} className="shrink-0 text-content-faint" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function SelectContent({ className, children, position = 'popper', ...props }, ref) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        className={cn(
          'relative z-dropdown max-h-72 min-w-[8rem] animate-scale-in overflow-hidden rounded-md border border-hairline bg-surface shadow-lg',
          position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport
          className={cn('p-1', position === 'popper' && 'w-full min-w-[var(--radix-select-trigger-width)]')}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(function SelectLabel({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn(
        'px-2 py-1.5 text-2xs font-semibold uppercase tracking-label text-content-faint',
        className,
      )}
      {...props}
    />
  )
})

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm py-1.5 pl-2 pr-7 text-base text-content-muted outline-none transition-colors duration-fast',
        'focus:bg-surface-sunken focus:text-content',
        'data-[state=checked]:bg-accent-soft data-[state=checked]:font-medium data-[state=checked]:text-accent-strong',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-45',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="absolute right-2 flex items-center">
        <SelectPrimitive.ItemIndicator>
          <Icon name="check" size={13} className="text-accent" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  )
})

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(function SelectSeparator({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-hairline-soft', className)}
      {...props}
    />
  )
})

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}
