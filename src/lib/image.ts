import type { PhotoRef } from './types'

/**
 * ПОДГОТОВКА ИЗОБРАЖЕНИЙ К ХРАНЕНИЮ.
 *
 * Прототип держит вложения в localStorage, а его квота — единицы мегабайт.
 * Снимок с телефона легко занимает 3–5 МБ, поэтому файл не сохраняется как
 * есть: он ужимается до миниатюры и кодируется в JPEG. Этого достаточно
 * для превью в карточке заявки и в очереди согласования.
 *
 * В промышленной версии оригинал уходит в защищённое файловое хранилище,
 * а интерфейс получает ссылку с контролем прав.
 */

/** Максимальная сторона миниатюры и качество JPEG */
const MAX_SIDE = 480
const QUALITY = 0.72

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
export const ACCEPTED_DOCUMENT_TYPES = [...ACCEPTED_IMAGE_TYPES, 'application/pdf']

/** Предельный размер исходного файла — до сжатия */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

export function isAcceptedImage(file: File) {
  return ACCEPTED_IMAGE_TYPES.includes(file.type.toLowerCase())
}

export function isAcceptedDocument(file: File) {
  return ACCEPTED_DOCUMENT_TYPES.includes(file.type.toLowerCase())
}

/**
 * Уменьшает изображение до миниатюры и возвращает dataURL.
 * PDF и прочие не-изображения возвращают пустую строку — превью для них нет.
 */
export async function fileToThumbnail(file: File): Promise<string> {
  if (!isAcceptedImage(file)) return ''

  const bitmapUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(bitmapUrl)

    const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height))
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) return ''

    // Белая подложка: у PNG с прозрачностью иначе будет чёрный фон в JPEG
    context.fillStyle = '#FFFFFF'
    context.fillRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)

    return canvas.toDataURL('image/jpeg', QUALITY)
  } catch {
    return ''
  } finally {
    URL.revokeObjectURL(bitmapUrl)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

/** Готовит файл к сохранению в позиции ТМЦ */
export async function fileToPhotoRef(file: File): Promise<PhotoRef> {
  return {
    id: `ph-${Math.random().toString(36).slice(2, 9)}`,
    name: file.name,
    size: file.size,
    dataUrl: await fileToThumbnail(file),
  }
}
