import { BrandMark } from './layout/brand'
import { QrCode } from './ui/qr-code'
import { OPERATIONS } from '@/design/statuses'
import { formatDateLong, formatDateTime, pluralWithCount } from '@/lib/format'
import type { Application } from '@/lib/types'

/**
 * ИТОГОВЫЙ ДОКУМЕНТ «МАТЕРИАЛЬНЫЙ ПРОПУСК» (п. 8.10 ТЗ).
 *
 * Свёрстан как настоящий бланк: фиксированные цвета вместо токенов тем —
 * документ печатается на бумаге и в тёмной теме не должен менять вид.
 *
 * Паспорт нерезидента в документ не включается: только отметка о том, что
 * личность подтверждена документом (п. 8.7 и п. 14 ТЗ). Аннулированный
 * и истёкший пропуск получают перечёркивающий штамп — распечатка не должна
 * выглядеть действующей.
 */
export function PassDocument({
  application,
  objectName,
}: {
  application: Application
  objectName: string
}) {
  const verifyPath = `/verify?n=${encodeURIComponent(application.registrationNumber ?? '')}`
  const verifyUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${verifyPath}` : verifyPath

  const stamp =
    application.status === 'cancelled'
      ? { label: 'АННУЛИРОВАН', color: '#BE123C' }
      : application.status === 'expired'
        ? { label: 'СРОК ИСТЁК', color: '#6D28D9' }
        : null

  const totalPositions = application.items.length

  return (
    <article
      data-print-root
      className="relative mx-auto max-w-[46rem] overflow-hidden bg-white p-8 text-ink-900 shadow-md print:shadow-none"
      style={{ colorScheme: 'light' }}
    >
      {/* Штамп поверх бланка: документ утратил силу */}
      {stamp ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        >
          <span
            className="select-none whitespace-nowrap rounded-lg border-[6px] px-8 py-3 text-5xl font-black uppercase tracking-plate"
            style={{
              color: stamp.color,
              borderColor: stamp.color,
              opacity: 0.16,
              transform: 'rotate(-16deg)',
            }}
          >
            {stamp.label}
          </span>
        </span>
      ) : null}

      {/* Шапка бланка */}
      <header className="flex items-start justify-between gap-4 border-b-2 border-brand-600 pb-4">
        <div className="flex items-start gap-3">
          <BrandMark size={40} />
          <div>
            <p className="text-md font-semibold leading-tight text-brand-600">
              АО «НК «QazExpoCongress»
            </p>
            <p className="text-xs text-ink-500">Астана, Республика Казахстан</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xs uppercase tracking-plate text-ink-500">Сервис</p>
          <p className="text-base font-semibold text-brand-600">QazExpoPass</p>
        </div>
      </header>

      <h1 className="mt-6 text-center text-2xl font-bold uppercase tracking-plate text-ink-900">
        Материальный пропуск
      </h1>

      <div className="mt-2 flex items-baseline justify-center gap-3">
        <p className="font-mono text-lg font-semibold text-brand-600">
          № {application.registrationNumber ?? '—'}
        </p>
        <p className="text-xs text-ink-500">
          от {formatDateLong(application.registeredAt ?? application.createdAt)}
        </p>
      </div>

      {/* Операция и дата — ключевые реквизиты на контрольно-пропускном пункте */}
      <div className="mt-5 flex items-stretch gap-4">
        <div className="flex-1 rounded border-2 border-brand-600 px-4 py-3 text-center">
          <p className="text-2xs font-semibold uppercase tracking-label text-ink-500">Операция</p>
          <p className="mt-0.5 text-xl font-bold uppercase tracking-plate text-brand-600">
            {OPERATIONS[application.operation].label}
          </p>
        </div>
        <div className="flex-1 rounded border border-ink-300 px-4 py-3 text-center">
          <p className="text-2xs font-semibold uppercase tracking-label text-ink-500">
            Действителен
          </p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-ink-900">
            {formatDateLong(application.validDate)}
          </p>
        </div>
      </div>

      {/* Реквизиты */}
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-ink-200 pt-4 text-sm">
        <DocRow label="Заявитель" value={application.applicantName} />
        <DocRow label="Организация" value={application.organization} />
        <DocRow label="Объект / блок" value={objectName} />
        <DocRow label="Номер заявки" value={application.applicationNumber} mono />
        <DocRow label="Место работы" value={application.workplace ?? '—'} />
        <DocRow
          label="Позиций ТМЦ"
          value={pluralWithCount(totalPositions, ['позиция', 'позиции', 'позиций'])}
        />
        <div className="col-span-2">
          <dt className="text-2xs font-semibold uppercase tracking-label text-ink-500">Основание</dt>
          <dd className="mt-0.5 whitespace-pre-line leading-relaxed text-ink-900">
            {application.basis}
          </dd>
        </div>
      </dl>

      {/* Перечень ТМЦ — компактный вид для бланка */}
      <section className="mt-5">
        <h2 className="text-2xs font-semibold uppercase tracking-label text-ink-500">
          Перечень товарно-материальных ценностей
        </h2>
        <table className="mt-2 w-full border-collapse text-xs">
          <thead>
            <tr className="bg-ink-50">
              {['№', 'Наименование', 'Кол-во', 'Ед.', 'Модель / описание', 'Серийный / инв. №'].map(
                (h) => (
                  <th
                    key={h}
                    className="border border-ink-200 px-2 py-1.5 text-left text-2xs font-semibold uppercase tracking-label text-ink-600"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {application.items.map((item, index) => (
              <tr key={item.id}>
                <td className="border border-ink-200 px-2 py-1.5 tabular-nums text-ink-500">
                  {index + 1}
                </td>
                <td className="border border-ink-200 px-2 py-1.5 font-medium text-ink-900">
                  {item.name}
                  {item.distinctiveFeatures ? (
                    <span className="block text-2xs font-normal text-ink-500">
                      {item.distinctiveFeatures}
                    </span>
                  ) : null}
                </td>
                <td className="border border-ink-200 px-2 py-1.5 tabular-nums text-ink-900">
                  {item.quantity}
                </td>
                <td className="border border-ink-200 px-2 py-1.5 text-ink-700">{item.unit}</td>
                <td className="border border-ink-200 px-2 py-1.5 text-ink-700">
                  {item.model || '—'}
                </td>
                <td className="border border-ink-200 px-2 py-1.5 font-mono text-ink-700">
                  {item.serialNumber || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Отметки: подтверждение заявителя, согласование, регистрация */}
      <section className="mt-5 grid grid-cols-3 gap-3 border-t border-ink-200 pt-4">
        <Endorsement
          title="Подтверждение заявителя"
          name={application.applicantName}
          note={
            application.isNonResident
              ? 'Личность подтверждена документом, удостоверяющим личность'
              : 'Подписано ЭЦП'
          }
          at={
            application.isNonResident ? application.createdAt : application.edsSignature?.signedAt
          }
          detail={
            application.isNonResident
              ? 'Нерезидент РК · ЭЦП не требуется'
              : application.edsSignature?.certificateSerial
                ? `Сертификат № ${application.edsSignature.certificateSerial}`
                : undefined
          }
        />
        <Endorsement
          title="Согласовано"
          name={application.objectAdminName ?? '—'}
          note="Администратор объекта"
          at={application.approvedAt}
        />
        <Endorsement
          title="Зарегистрировано"
          name={application.gocOfficerName ?? '—'}
          note="Главный оперативный центр"
          at={application.registeredAt}
        />
      </section>

      {/* Причина аннулирования печатается на самом бланке */}
      {application.status === 'cancelled' && application.decisionComment ? (
        <p className="mt-4 rounded border border-[#BE123C] px-3 py-2 text-xs text-[#9F1239]">
          <span className="font-semibold uppercase tracking-label">Аннулирован. </span>
          {application.decisionComment}
        </p>
      ) : null}

      {/* QR-код проверки */}
      <footer className="mt-6 flex items-end justify-between gap-4 border-t border-ink-200 pt-4">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-label text-ink-500">
            Проверка подлинности
          </p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-ink-600">
            Отсканируйте QR-код или откройте страницу проверки QazExpoPass и введите
            регистрационный номер документа.
          </p>
          <p className="mt-1.5 break-all font-mono text-2xs text-ink-500">{verifyUrl}</p>
          <p className="mt-2 text-2xs text-ink-400">
            Сформировано {formatDateTime(application.registeredAt ?? application.updatedAt)} ·
            Документ создан автоматически, собственноручная подпись не требуется
          </p>
        </div>
        <div className="shrink-0 text-center">
          <QrCode value={verifyUrl} size={104} />
          <p className="mt-1 font-mono text-2xs text-ink-500">
            {application.registrationNumber ?? '—'}
          </p>
        </div>
      </footer>
    </article>
  )
}

function DocRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-2xs font-semibold uppercase tracking-label text-ink-500">{label}</dt>
      <dd className={`mt-0.5 text-ink-900 ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  )
}

function Endorsement({
  title,
  name,
  note,
  at,
  detail,
}: {
  title: string
  name: string
  note: string
  at?: string
  detail?: string
}) {
  const done = Boolean(at)

  return (
    <div
      className="rounded border p-2.5"
      style={{ borderColor: done ? '#BBF7D0' : '#E1E5EB', background: done ? '#F0FDF4' : '#FFFFFF' }}
    >
      <p className="text-2xs font-semibold uppercase tracking-label text-ink-500">{title}</p>
      <p className="mt-1 text-xs font-medium text-ink-900">{name}</p>
      <p className="mt-0.5 text-2xs leading-snug text-ink-600">{note}</p>
      {detail ? <p className="mt-0.5 font-mono text-2xs text-ink-500">{detail}</p> : null}
      {at ? (
        <p className="mt-1 flex items-center gap-1 text-2xs tabular-nums text-ink-500">
          <span aria-hidden="true" style={{ color: '#16A34A' }}>
            ✓
          </span>
          {formatDateTime(at)}
        </p>
      ) : null}
    </div>
  )
}
