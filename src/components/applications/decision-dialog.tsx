'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea, Field } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

/**
 * РЕШЕНИЕ С ОБЯЗАТЕЛЬНЫМ КОММЕНТАРИЕМ.
 *
 * Возврат на доработку, отклонение и аннулирование по ТЗ требуют
 * зафиксированной причины (п. 7 и п. 8.8). Диалог один на все три
 * действия — правило «без текста решение не принимается» живёт
 * в одном месте, а не копируется по экранам.
 */
export type DecisionKind = 'return' | 'reject' | 'cancel'

const COPY: Record<
  DecisionKind,
  { title: string; description: string; label: string; placeholder: string; submit: string }
> = {
  return: {
    title: 'Вернуть заявку на доработку',
    description: 'Заявитель получит уведомление и сможет исправить данные',
    label: 'Комментарий',
    placeholder: 'Например: уточните основание, добавьте номер договора',
    submit: 'Вернуть',
  },
  reject: {
    title: 'Отклонить заявку',
    description: 'Процесс завершится отказом с зафиксированной причиной',
    label: 'Причина отклонения',
    placeholder: 'Например: состав ТМЦ не соответствует основанию',
    submit: 'Отклонить',
  },
  cancel: {
    title: 'Аннулировать пропуск',
    description: 'Документ будет отменён, запись останется в реестре',
    label: 'Причина аннулирования',
    placeholder: 'Например: мероприятие отменено, перемещение не состоится',
    submit: 'Аннулировать',
  },
}

export function DecisionDialog({
  kind,
  applicationNumber,
  onClose,
  onConfirm,
}: {
  /** null — диалог закрыт */
  kind: DecisionKind | null
  applicationNumber?: string
  onClose: () => void
  onConfirm: (kind: DecisionKind, comment: string) => void
}) {
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  // Поле очищается при каждом открытии: чужой текст подставлять нельзя
  useEffect(() => {
    if (kind) {
      setComment('')
      setError('')
    }
  }, [kind])

  const copy = kind ? COPY[kind] : null

  function submit() {
    if (!kind) return
    if (!comment.trim()) {
      setError(kind === 'return' ? 'Комментарий обязателен' : 'Причина обязательна')
      return
    }
    onConfirm(kind, comment.trim())
    onClose()
  }

  return (
    <Dialog open={kind !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {copy ? (
          <>
            <DialogHeader>
              <DialogTitle>{copy.title}</DialogTitle>
              <DialogDescription>
                {applicationNumber ? `${applicationNumber} · ` : ''}
                {copy.description}
              </DialogDescription>
            </DialogHeader>

            <DialogBody>
              <Field
                label={copy.label}
                required
                error={error}
                hint="Текст будет направлен заявителю и зафиксирован в истории заявки"
                htmlFor="decision-comment"
              >
                <Textarea
                  id="decision-comment"
                  rows={4}
                  autoFocus
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value)
                    if (e.target.value.trim()) setError('')
                  }}
                  invalid={Boolean(error)}
                  placeholder={copy.placeholder}
                />
              </Field>
            </DialogBody>

            <DialogFooter>
              <Button variant="ghost" size="md" onClick={onClose}>
                Отмена
              </Button>
              <Button
                variant={kind === 'return' ? 'primary' : 'danger'}
                size="md"
                onClick={submit}
              >
                {copy.submit}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
