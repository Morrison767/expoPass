'use client'

import { QRCodeSVG } from 'qrcode.react'

/**
 * QR-код проверки действительности пропуска (п. 8.11 ТЗ).
 * Ведёт на публичную страницу проверки; персональные данные в код
 * не кодируются — только регистрационный номер документа.
 *
 * Цвета заданы фиксированными, а не токенами темы: код печатается
 * на бумаге и должен читаться сканером в любом случае.
 */
export function QrCode({
  value,
  size = 104,
  className,
}: {
  value: string
  size?: number
  className?: string
}) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        padding: 6,
        background: '#FFFFFF',
        border: '1px solid #DFE3EA',
        borderRadius: 4,
        lineHeight: 0,
      }}
    >
      <QRCodeSVG value={value} size={size} level="M" bgColor="#FFFFFF" fgColor="#101B2D" />
    </span>
  )
}
