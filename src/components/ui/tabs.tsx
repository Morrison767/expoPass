'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/cn'

/**
 * Табы: активный получает светящуюся подчёркивающую кромку — тот же
 * механизм индикации, что у активного пункта навигации.
 */
const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn('flex items-center gap-1 overflow-x-auto border-b border-hairline', className)}
      {...props}
    />
  )
})

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'focus-ring relative -mb-px inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 text-base font-medium text-content-subtle transition-colors duration-fast',
        'hover:text-content',
        'data-[state=active]:border-accent data-[state=active]:text-accent-strong',
        'disabled:pointer-events-none disabled:opacity-45',
        className,
      )}
      {...props}
    />
  )
})

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn('focus-ring animate-fade-in outline-none', className)}
      {...props}
    />
  )
})

export { Tabs, TabsList, TabsTrigger, TabsContent }
