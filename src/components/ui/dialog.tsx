'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/cn'
import { Icon } from './icon'

/**
 * Модальное окно. Оверлей — приглушённый корпус, панель — рабочая
 * поверхность с фаской. Шапка и подвал окна работают на утопленной
 * поверхности, как шапки панелей в ИС учёта мероприятий.
 */
const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn('fixed inset-0 z-overlay animate-fade-in bg-overlay backdrop-blur-[2px]', className)}
      {...props}
    />
  )
})

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { size?: 'md' | 'lg' | 'xl' }
>(function DialogContent({ className, children, size = 'md', ...props }, ref) {
  const sizes = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed left-1/2 top-1/2 z-modal grid -translate-x-1/2 -translate-y-1/2 grid-rows-[auto_1fr_auto] gap-0',
          // На телефоне окно занимает почти весь экран: поля 2rem съедали
          // половину ширины, а 3rem по высоте не хватало для длинных форм
          'max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1rem)] sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100vw-2rem)]',
          'animate-scale-in overflow-hidden rounded-lg border border-hairline bg-surface shadow-xl',
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="focus-ring absolute right-3 top-3 inline-flex h-control-sm w-control-sm items-center justify-center rounded-sm text-content-faint transition-colors duration-fast hover:bg-surface-muted hover:text-content"
          aria-label="Закрыть"
        >
          <Icon name="x" size={14} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-1 border-b border-hairline bg-surface-sunken px-4 py-3 pr-12', className)}
      {...props}
    />
  )
}

function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('min-h-0 overflow-y-auto px-4 py-4', className)} {...props} />
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-end gap-2 border-t border-hairline bg-surface-sunken px-4 py-3',
        className,
      )}
      {...props}
    />
  )
}

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('text-lg font-semibold leading-snug text-content', className)}
      {...props}
    />
  )
})

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-base text-content-subtle', className)}
      {...props}
    />
  )
})

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
