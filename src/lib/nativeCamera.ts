import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

/**
 * True only inside the Capacitor shell. In a browser - including the installed
 * PWA - this is false and the plain file input is used instead.
 */
export function isNativePlatform() {
  return Capacitor.isNativePlatform()
}

/** Turns a Capacitor photo URI into a File the existing upload path accepts. */
async function toFile(webPath: string | undefined, index: number): Promise<File | null> {
  if (!webPath) return null

  const response = await fetch(webPath)
  const blob = await response.blob()
  const type = blob.type || 'image/jpeg'
  const extension = type.split('/')[1] ?? 'jpg'

  return new File([blob], `photo-${Date.now()}-${index}.${extension}`, { type })
}

/** Opens the camera for a single shot. Resolves to [] if the user backs out. */
export async function takePhoto(): Promise<File[]> {
  const photo = await Camera.getPhoto({
    source: CameraSource.Camera,
    resultType: CameraResultType.Uri,
    quality: 85,
    // The editor is a needless extra step for a travel snapshot.
    allowEditing: false,
  })

  const file = await toFile(photo.webPath, 0)
  return file ? [file] : []
}

/** Opens the system gallery picker, which allows a multi-selection. */
export async function pickPhotos(limit = 10): Promise<File[]> {
  const { photos } = await Camera.pickImages({ quality: 85, limit })

  const files = await Promise.all(photos.map((photo, index) => toFile(photo.webPath, index)))
  return files.filter((file): file is File => file !== null)
}

/**
 * Capacitor rejects when the user cancels, which is not an error worth showing.
 * Returns null for "nothing to report", a message for a real failure.
 */
export function describeCameraError(error: unknown): string | null {
  const message = error instanceof Error ? error.message : String(error)
  if (/cancell?ed|denied by user|no image picked/i.test(message)) return null
  return message
}
