import { CONSENT_VERSION } from './validation'
import type {
  Application,
  SiteObject,
  User,
  InventoryItem,
  TimelineEntry,
  Unit,
} from './types'

/**
 * НАЧАЛЬНЫЕ ДАННЫЕ ПРОТОТИПА.
 * Засеиваются один раз при первом запуске, если localStorage пуст.
 * Реального бэкенда нет — вся «база» живёт в браузере.
 */

/**
 * Единый пароль демонстрационных учётных записей.
 * В прототипе пароль не проверяется по-настоящему — достаточно любого
 * непустого значения; поле существует, чтобы модель совпадала с боевой.
 */
export const DEMO_PASSWORD = 'Qazexpo2026'

/* ─────────────── Справочник объектов (Приложение 1 ТЗ) ─────────────── */

const RAW_OBJECTS: Array<[string, string, string]> = [
  ['Международный центр искусственного интеллекта Alem.AI', 'Alem.AI жасанды интеллект халықаралық орталығы', 'Alem.AI International Artificial Intelligence Centre'],
  ['B2.2', 'B2.2', 'B2.2'],
  ['B2.4', 'B2.4', 'B2.4'],
  ['C1.1', 'C1.1', 'C1.1'],
  ['C1.2', 'C1.2', 'C1.2'],
  ['C1.3', 'C1.3', 'C1.3'],
  ['C1.4', 'C1.4', 'C1.4'],
  ['C2.1', 'C2.1', 'C2.1'],
  ['C2.2', 'C2.2', 'C2.2'],
  ['C2.3', 'C2.3', 'C2.3'],
  ['C2.4', 'C2.4', 'C2.4'],
  ['C3.1', 'C3.1', 'C3.1'],
  ['C3.2', 'C3.2', 'C3.2'],
  ['C3.3', 'C3.3', 'C3.3'],
  ['C3.4', 'C3.4', 'C3.4'],
  ['C3.5', 'C3.5', 'C3.5'],
  ['C3.6', 'C3.6', 'C3.6'],
  ['C4.1', 'C4.1', 'C4.1'],
  ['C4.2', 'C4.2', 'C4.2'],
  ['C4.3', 'C4.3', 'C4.3'],
  ['C4.4', 'C4.4', 'C4.4'],
  ['C4.5', 'C4.5', 'C4.5'],
  ['C4.6', 'C4.6', 'C4.6'],
  ['Конгресс-центр', 'Конгресс-орталық', 'Congress Centre'],
  ['Международный выставочный центр', 'Халықаралық көрме орталығы', 'International Exhibition Centre'],
]

export const SEED_OBJECTS: SiteObject[] = RAW_OBJECTS.map(([ru, kk, en], index) => ({
  id: `obj-${String(index + 1).padStart(2, '0')}`,
  nameRu: ru,
  nameKk: kk,
  nameEn: en,
  order: index + 1,
  isActive: true,
  // Администратор объекта закрепляется за частью объектов — см. SEED_USERS
  adminUserId: undefined,
}))

/* ─────────────── Тестовые пользователи ─────────────── */

export const SEED_USERS: User[] = [
  {
    id: 'usr-01',
    lastName: 'Ахметова',
    firstName: 'Дана',
    middleName: 'Ерлановна',
    email: 'd.akhmetova@qazexpo.kz',
    phone: '+7 701 214 55 08',
    category: 'employee',
    organization: 'АО «НК «QazExpoCongress»',
    workplace: 'Конгресс-центр, каб. 312',
    roles: ['user'],
    objectIds: [],
    accountStatus: 'active',
    isNonResident: false,
    createdAt: '2026-06-02T09:12:00+05:00',
    password: DEMO_PASSWORD,
    consent: { acceptedAt: '2026-08-01T00:00:00+05:00', version: CONSENT_VERSION },
  },
  {
    id: 'usr-02',
    lastName: 'Yilmaz',
    firstName: 'Kerem',
    email: 'k.yilmaz@expo-stand.com.tr',
    phone: '+90 532 447 19 63',
    category: 'contractor',
    organization: 'ТОО «Expo Stand Systems»',
    workplace: 'Павильон C3.2',
    roles: ['user'],
    objectIds: ['obj-14'],
    accountStatus: 'active',
    // Нерезидент РК: подтверждение заявки — паспорт, ЭЦП не требуется
    isNonResident: true,
    createdAt: '2026-07-15T14:38:00+05:00',
    password: DEMO_PASSWORD,
    consent: { acceptedAt: '2026-08-01T00:00:00+05:00', version: CONSENT_VERSION },
  },
  {
    id: 'usr-03',
    lastName: 'Сериков',
    firstName: 'Арман',
    middleName: 'Болатович',
    email: 'a.serikov@qazexpo.kz',
    phone: '+7 702 331 07 42',
    category: 'employee',
    organization: 'АО «НК «QazExpoCongress»',
    workplace: 'Международный выставочный центр, каб. 104',
    roles: ['object_admin'],
    // Зона ответственности: павильоны C3 и Международный выставочный центр
    objectIds: ['obj-12', 'obj-13', 'obj-14', 'obj-15', 'obj-16', 'obj-17', 'obj-25'],
    accountStatus: 'active',
    isNonResident: false,
    createdAt: '2026-05-20T08:05:00+05:00',
    password: DEMO_PASSWORD,
    consent: { acceptedAt: '2026-08-01T00:00:00+05:00', version: CONSENT_VERSION },
  },
  {
    id: 'usr-04',
    lastName: 'Оспанова',
    firstName: 'Гульмира',
    middleName: 'Сериковна',
    email: 'g.ospanova@qazexpo.kz',
    phone: '+7 705 618 22 90',
    category: 'employee',
    organization: 'АО «НК «QazExpoCongress»',
    workplace: 'Главный оперативный центр',
    roles: ['goc_officer'],
    objectIds: [],
    accountStatus: 'active',
    isNonResident: false,
    createdAt: '2026-05-20T08:07:00+05:00',
    password: DEMO_PASSWORD,
    consent: { acceptedAt: '2026-08-01T00:00:00+05:00', version: CONSENT_VERSION },
  },
  {
    id: 'usr-05',
    lastName: 'Нурланов',
    firstName: 'Бекзат',
    middleName: 'Сакенович',
    email: 'b.nurlanov@qazexpo.kz',
    phone: '+7 700 902 45 11',
    category: 'employee',
    organization: 'АО «НК «QazExpoCongress»',
    workplace: 'Департамент ИТ, каб. 208',
    roles: ['super_admin', 'account_admin'],
    objectIds: [],
    accountStatus: 'active',
    isNonResident: false,
    createdAt: '2026-05-18T07:40:00+05:00',
    password: DEMO_PASSWORD,
    consent: { acceptedAt: '2026-08-01T00:00:00+05:00', version: CONSENT_VERSION },
  },
  {
    id: 'usr-06',
    lastName: 'Ким',
    firstName: 'Марина',
    middleName: 'Витальевна',
    email: 'm.kim@astana-media.kz',
    phone: '+7 747 155 30 24',
    category: 'tenant',
    organization: 'ТОО «Astana Media Group»',
    workplace: 'Павильон C1.2, блок 4',
    roles: ['user'],
    objectIds: ['obj-05'],
    accountStatus: 'pending_admin_confirmation',
    isNonResident: false,
    createdAt: '2026-08-14T16:22:00+05:00',
    password: DEMO_PASSWORD,
    consent: { acceptedAt: '2026-08-01T00:00:00+05:00', version: CONSENT_VERSION },
  },
  /* Учётные записи ниже демонстрируют остальные статусы: они попадают
     в очередь регистраций и в сообщения формы входа */
  {
    id: 'usr-07',
    lastName: 'Тулегенов',
    firstName: 'Ерлан',
    middleName: 'Маратович',
    email: 'e.tulegenov@stroy-partner.kz',
    phone: '+7 708 442 61 37',
    category: 'contractor',
    organization: 'ТОО «Строй-Партнёр KZ»',
    roles: ['user'],
    objectIds: [],
    accountStatus: 'needs_clarification',
    isNonResident: false,
    createdAt: '2026-08-13T11:47:00+05:00',
    password: DEMO_PASSWORD,
    consent: { acceptedAt: '2026-08-13T11:47:00+05:00', version: CONSENT_VERSION },
    clarificationComment:
      'Уточните основание взаимодействия с Обществом: укажите номер договора подряда либо реквизиты письма.',
    reviewedBy: 'Нурланов Бекзат Сакенович',
    reviewedAt: '2026-08-14T09:15:00+05:00',
  },
  {
    id: 'usr-08',
    lastName: 'Сагинтаева',
    firstName: 'Айгерим',
    email: 'a.sagintayeva@mail.kz',
    phone: '+7 775 903 18 52',
    category: 'other',
    roles: ['user'],
    objectIds: [],
    accountStatus: 'email_unconfirmed',
    isNonResident: false,
    createdAt: '2026-08-18T07:20:00+05:00',
    password: DEMO_PASSWORD,
    consent: { acceptedAt: '2026-08-18T07:20:00+05:00', version: CONSENT_VERSION },
  },
  {
    id: 'usr-09',
    lastName: 'Petrov',
    firstName: 'Anton',
    email: 'a.petrov@unknown-vendor.net',
    phone: '+7 701 000 11 22',
    category: 'counterparty',
    organization: 'Неустановленная организация',
    roles: ['user'],
    objectIds: [],
    accountStatus: 'rejected',
    isNonResident: false,
    createdAt: '2026-08-10T15:05:00+05:00',
    password: DEMO_PASSWORD,
    consent: { acceptedAt: '2026-08-10T15:05:00+05:00', version: CONSENT_VERSION },
    rejectionReason:
      'Организация не подтверждена: договорные отношения с АО «НК «QazExpoCongress» отсутствуют.',
    reviewedBy: 'Нурланов Бекзат Сакенович',
    reviewedAt: '2026-08-11T10:30:00+05:00',
  },
  {
    id: 'usr-10',
    lastName: 'Жумабаева',
    firstName: 'Асель',
    middleName: 'Кайратовна',
    email: 'a.zhumabayeva@qazexpo.kz',
    phone: '+7 707 214 88 63',
    category: 'employee',
    organization: 'АО «НК «QazExpoCongress»',
    workplace: 'Служба внутреннего аудита, каб. 411',
    // Аудитор только читает: реестры и историю, без права решений
    roles: ['auditor'],
    objectIds: [],
    accountStatus: 'active',
    isNonResident: false,
    createdAt: '2026-05-22T09:30:00+05:00',
    password: DEMO_PASSWORD,
    consent: { acceptedAt: '2026-08-01T00:00:00+05:00', version: CONSENT_VERSION },
  },
]

/** Закрепление администратора объекта в справочнике */
for (const object of SEED_OBJECTS) {
  if (['obj-12', 'obj-13', 'obj-14', 'obj-15', 'obj-16', 'obj-17', 'obj-25'].includes(object.id)) {
    object.adminUserId = 'usr-03'
  }
}

/* ─────────────── Тестовые заявки ─────────────── */

function item(
  id: string,
  name: string,
  quantity: number,
  unit: Unit,
  extra: Partial<InventoryItem> = {},
): InventoryItem {
  return { id, name, quantity, unit, photos: [], ...extra }
}

function entry(
  id: string,
  at: string,
  actorId: string,
  actorName: string,
  action: TimelineEntry['action'],
  statusAfter: TimelineEntry['statusAfter'],
  comment?: string,
): TimelineEntry {
  return { id, at, actorId, actorName, action, statusAfter, comment }
}

export const SEED_APPLICATIONS: Application[] = [
  /* 1. Резидент РК, подписана ЭЦП, ждёт согласования администратором объекта */
  {
    id: 'app-01',
    applicationNumber: 'ЗВ-2026-000148',
    applicantId: 'usr-01',
    applicantName: 'Ахметова Дана Ерлановна',
    organization: 'АО «НК «QazExpoCongress»',
    workplace: 'Конгресс-центр, каб. 312',
    operation: 'in',
    objectId: 'obj-14',
    basis:
      'Монтаж экспозиции к форуму «Digital Almaty 2026». Основание — служебная записка № 07-14/338 от 12.08.2026.',
    validDate: '2026-08-21',
    items: [
      item('itm-01-1', 'Ноутбук Dell Latitude 5540', 4, 'шт', {
        model: 'Latitude 5540, i7/16Gb',
        serialNumber: 'DL5540-KZ-0417',
        distinctiveFeatures: 'Инв. наклейки Общества на корпусе',
      }),
      item('itm-01-2', 'Панель светодиодная P2.5', 12, 'шт', {
        model: 'Absen A2725',
        distinctiveFeatures: 'Кейсы транспортировочные, чёрные',
      }),
      item('itm-01-3', 'Кабель HDMI 10 м', 8, 'шт'),
    ],
    attachments: [
      {
        id: 'att-01-1',
        fileName: 'sluzhebnaya-zapiska-338.pdf',
        size: 284_160,
        mimeType: 'application/pdf',
        uploadedAt: '2026-08-17T10:04:00+05:00',
        kind: 'supporting',
      },
    ],
    isNonResident: false,
    confirmationMethod: 'eds',
    edsSignature: {
      signedAt: '2026-08-17T10:12:33+05:00',
      certificateSubject: 'АХМЕТОВА ДАНА ЕРЛАНОВНА, ИИН 8704...2317',
      certificateSerial: '1f3a09c47b58e2d6',
      dataHash: 'a41c7e09b2f5d83a6c0e94b71d28f5ac',
    },
    status: 'pending_object_admin',
    objectAdminId: 'usr-03',
    objectAdminName: 'Сериков Арман Болатович',
    timeline: [
      entry('tl-01-1', '2026-08-17T09:58:00+05:00', 'usr-01', 'Ахметова Д.Е.', 'created', 'draft'),
      entry('tl-01-2', '2026-08-17T10:12:33+05:00', 'usr-01', 'Ахметова Д.Е.', 'signed', 'pending_signature', 'Заявка подписана ЭЦП'),
      entry('tl-01-3', '2026-08-17T10:13:02+05:00', 'usr-01', 'Ахметова Д.Е.', 'submitted', 'pending_object_admin'),
    ],
    createdAt: '2026-08-17T09:58:00+05:00',
    updatedAt: '2026-08-17T10:13:02+05:00',
  },

  /* 2. Нерезидент РК, паспорт приложен, согласована — ждёт регистрации в ГОЦ */
  {
    id: 'app-02',
    applicationNumber: 'ЗВ-2026-000151',
    applicantId: 'usr-02',
    applicantName: 'Yilmaz Kerem',
    organization: 'ТОО «Expo Stand Systems»',
    workplace: 'Павильон C3.2',
    operation: 'out',
    objectId: 'obj-13',
    basis:
      'Демонтаж выставочного стенда после завершения экспозиции. Договор подряда № 114-П/2026 от 03.06.2026.',
    validDate: '2026-08-19',
    items: [
      item('itm-02-1', 'Конструкции стенда алюминиевые', 34, 'компл', {
        distinctiveFeatures: 'Маркировка ESS-C32',
      }),
      item('itm-02-2', 'Инструмент электромонтажный', 2, 'ящик', {
        serialNumber: 'ESS-TB-07, ESS-TB-11',
      }),
      item('itm-02-3', 'Ковровое покрытие', 6, 'рулон'),
    ],
    attachments: [
      {
        id: 'att-02-1',
        fileName: 'passport-yilmaz-k.pdf',
        size: 1_642_880,
        mimeType: 'application/pdf',
        uploadedAt: '2026-08-16T12:31:00+05:00',
        // Паспорт нерезидента: защищённое хранилище, не публикуется на QR-странице
        kind: 'passport',
      },
      {
        id: 'att-02-2',
        fileName: 'dogovor-114-P-2026.pdf',
        size: 512_400,
        mimeType: 'application/pdf',
        uploadedAt: '2026-08-16T12:33:00+05:00',
        kind: 'supporting',
      },
    ],
    isNonResident: true,
    confirmationMethod: 'passport',
    status: 'pending_goc',
    objectAdminId: 'usr-03',
    objectAdminName: 'Сериков Арман Болатович',
    approvedAt: '2026-08-16T15:47:00+05:00',
    timeline: [
      entry('tl-02-1', '2026-08-16T12:20:00+05:00', 'usr-02', 'Yilmaz K.', 'created', 'draft'),
      entry('tl-02-2', '2026-08-16T12:31:00+05:00', 'usr-02', 'Yilmaz K.', 'passport_uploaded', 'pending_passport', 'Приложена копия паспорта'),
      entry('tl-02-3', '2026-08-16T12:34:00+05:00', 'usr-02', 'Yilmaz K.', 'submitted', 'pending_object_admin'),
      entry('tl-02-4', '2026-08-16T15:47:00+05:00', 'usr-03', 'Сериков А.Б.', 'approved', 'pending_goc', 'Состав ТМЦ соответствует договору подряда'),
    ],
    createdAt: '2026-08-16T12:20:00+05:00',
    updatedAt: '2026-08-16T15:47:00+05:00',
  },

  /* 3. Зарегистрирована ГОЦ — есть номер, PDF и QR */
  {
    id: 'app-03',
    applicationNumber: 'ЗВ-2026-000139',
    registrationNumber: 'МП-2026-000412',
    applicantId: 'usr-01',
    applicantName: 'Ахметова Дана Ерлановна',
    organization: 'АО «НК «QazExpoCongress»',
    workplace: 'Конгресс-центр, каб. 312',
    operation: 'out',
    objectId: 'obj-24',
    basis: 'Передача оргтехники в сервисный центр для планового обслуживания.',
    validDate: '2026-08-18',
    items: [
      item('itm-03-1', 'МФУ Kyocera TASKalfa 3253ci', 1, 'шт', {
        serialNumber: 'W7F2X01455',
        distinctiveFeatures: 'Инв. № 01360214',
      }),
      item('itm-03-2', 'Картридж TK-8365K', 3, 'шт'),
    ],
    attachments: [],
    isNonResident: false,
    confirmationMethod: 'eds',
    edsSignature: {
      signedAt: '2026-08-14T11:02:10+05:00',
      certificateSubject: 'АХМЕТОВА ДАНА ЕРЛАНОВНА, ИИН 8704...2317',
      certificateSerial: '1f3a09c47b58e2d6',
      dataHash: 'd93b6120fa4e7c85b1d0392a6fe4c718',
    },
    status: 'registered',
    objectAdminId: 'usr-03',
    objectAdminName: 'Сериков Арман Болатович',
    approvedAt: '2026-08-14T14:20:00+05:00',
    gocOfficerId: 'usr-04',
    gocOfficerName: 'Оспанова Гульмира Сериковна',
    registeredAt: '2026-08-15T09:05:00+05:00',
    timeline: [
      entry('tl-03-1', '2026-08-14T10:50:00+05:00', 'usr-01', 'Ахметова Д.Е.', 'created', 'draft'),
      entry('tl-03-2', '2026-08-14T11:02:10+05:00', 'usr-01', 'Ахметова Д.Е.', 'signed', 'pending_signature', 'Заявка подписана ЭЦП'),
      entry('tl-03-3', '2026-08-14T11:03:00+05:00', 'usr-01', 'Ахметова Д.Е.', 'submitted', 'pending_object_admin'),
      entry('tl-03-4', '2026-08-14T14:20:00+05:00', 'usr-03', 'Сериков А.Б.', 'approved', 'pending_goc'),
      entry('tl-03-5', '2026-08-15T09:05:00+05:00', 'usr-04', 'Оспанова Г.С.', 'registered', 'registered', 'Присвоен номер МП-2026-000412'),
    ],
    createdAt: '2026-08-14T10:50:00+05:00',
    updatedAt: '2026-08-15T09:05:00+05:00',
  },

  /* 4. Возвращена на доработку — комментарий обязателен */
  {
    id: 'app-04',
    applicationNumber: 'ЗВ-2026-000144',
    applicantId: 'usr-02',
    applicantName: 'Yilmaz Kerem',
    organization: 'ТОО «Expo Stand Systems»',
    workplace: 'Павильон C3.2',
    operation: 'in',
    objectId: 'obj-16',
    basis: 'Завоз расходных материалов для монтажа.',
    validDate: '2026-08-20',
    items: [item('itm-04-1', 'Профиль алюминиевый', 40, 'м')],
    attachments: [
      {
        id: 'att-04-1',
        fileName: 'passport-yilmaz-k.pdf',
        size: 1_642_880,
        mimeType: 'application/pdf',
        uploadedAt: '2026-08-15T17:12:00+05:00',
        kind: 'passport',
      },
    ],
    isNonResident: true,
    confirmationMethod: 'passport',
    status: 'returned',
    objectAdminId: 'usr-03',
    objectAdminName: 'Сериков Арман Болатович',
    decisionComment:
      'Уточните основание: не указан номер договора либо письма. Добавьте позиции крепежа, заявленные в заявке на монтаж.',
    timeline: [
      entry('tl-04-1', '2026-08-15T17:02:00+05:00', 'usr-02', 'Yilmaz K.', 'created', 'draft'),
      entry('tl-04-2', '2026-08-15T17:12:00+05:00', 'usr-02', 'Yilmaz K.', 'passport_uploaded', 'pending_passport'),
      entry('tl-04-3', '2026-08-15T17:15:00+05:00', 'usr-02', 'Yilmaz K.', 'submitted', 'pending_object_admin'),
      entry(
        'tl-04-4',
        '2026-08-16T09:31:00+05:00',
        'usr-03',
        'Сериков А.Б.',
        'returned',
        'returned',
        'Уточните основание: не указан номер договора либо письма. Добавьте позиции крепежа, заявленные в заявке на монтаж.',
      ),
    ],
    createdAt: '2026-08-15T17:02:00+05:00',
    updatedAt: '2026-08-16T09:31:00+05:00',
  },

  /* 5. Черновик заявителя */
  {
    id: 'app-05',
    applicationNumber: 'ЗВ-2026-000153',
    applicantId: 'usr-01',
    applicantName: 'Ахметова Дана Ерлановна',
    organization: 'АО «НК «QazExpoCongress»',
    workplace: 'Конгресс-центр, каб. 312',
    operation: 'in',
    objectId: 'obj-01',
    basis: 'Производственная необходимость: замена презентационного оборудования в переговорной.',
    validDate: '2026-08-25',
    items: [item('itm-05-1', 'Проектор Epson EB-L265F', 1, 'шт', { model: 'EB-L265F' })],
    attachments: [],
    isNonResident: false,
    status: 'draft',
    timeline: [
      entry('tl-05-1', '2026-08-18T08:41:00+05:00', 'usr-01', 'Ахметова Д.Е.', 'created', 'draft'),
    ],
    createdAt: '2026-08-18T08:41:00+05:00',
    updatedAt: '2026-08-18T08:41:00+05:00',
  },

  /* 6. Истекла — дата действия прошла, запись остаётся в реестре */
  {
    id: 'app-06',
    applicationNumber: 'ЗВ-2026-000121',
    registrationNumber: 'МП-2026-000377',
    applicantId: 'usr-06',
    applicantName: 'Ким Марина Витальевна',
    organization: 'ТОО «Astana Media Group»',
    workplace: 'Павильон C1.2, блок 4',
    operation: 'in',
    objectId: 'obj-05',
    basis: 'Завоз съёмочного оборудования для освещения мероприятия.',
    validDate: '2026-08-08',
    items: [
      item('itm-06-1', 'Камера Sony FX6', 2, 'шт', { serialNumber: 'FX6-118204, FX6-118231' }),
      item('itm-06-2', 'Штатив Manfrotto', 2, 'шт'),
      item('itm-06-3', 'Комплект света', 1, 'компл'),
    ],
    attachments: [],
    isNonResident: false,
    confirmationMethod: 'eds',
    edsSignature: {
      signedAt: '2026-08-06T13:20:00+05:00',
      certificateSubject: 'КИМ МАРИНА ВИТАЛЬЕВНА, ИИН 9112...4408',
      certificateSerial: '7c2e51ab90f34d18',
      dataHash: '5e8a2c04d7b61f39ae02c8517b3d9046',
    },
    status: 'expired',
    objectAdminId: 'usr-03',
    objectAdminName: 'Сериков Арман Болатович',
    approvedAt: '2026-08-06T16:02:00+05:00',
    gocOfficerId: 'usr-04',
    gocOfficerName: 'Оспанова Гульмира Сериковна',
    registeredAt: '2026-08-07T08:15:00+05:00',
    timeline: [
      entry('tl-06-1', '2026-08-06T13:10:00+05:00', 'usr-06', 'Ким М.В.', 'created', 'draft'),
      entry('tl-06-2', '2026-08-06T13:20:00+05:00', 'usr-06', 'Ким М.В.', 'signed', 'pending_signature'),
      entry('tl-06-3', '2026-08-06T13:22:00+05:00', 'usr-06', 'Ким М.В.', 'submitted', 'pending_object_admin'),
      entry('tl-06-4', '2026-08-06T16:02:00+05:00', 'usr-03', 'Сериков А.Б.', 'approved', 'pending_goc'),
      entry('tl-06-5', '2026-08-07T08:15:00+05:00', 'usr-04', 'Оспанова Г.С.', 'registered', 'registered'),
      entry('tl-06-6', '2026-08-09T00:05:00+05:00', 'system', 'Система', 'expired', 'expired', 'Дата действия завершилась'),
    ],
    createdAt: '2026-08-06T13:10:00+05:00',
    updatedAt: '2026-08-09T00:05:00+05:00',
  },
]
