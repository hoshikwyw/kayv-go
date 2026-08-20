/**
 * Generates the PWA icon set into public/icons/.
 *
 * Deliberately dependency-free: it writes PNGs by hand (zlib is built into
 * Node) so `npm run icons` works on a clean checkout. The artwork is a
 * placeholder mark - swap in real files of the same names when you have them.
 *
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

const EMERALD = [5, 150, 105]
const DEEP = [4, 120, 87]
const SNOW = [255, 255, 255]
const SUN = [251, 191, 36]

// ---------------------------------------------------------------- png writer

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buffer) {
  let c = -1
  for (let i = 0; i < buffer.length; i++) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

/** @param {Uint8Array} rgba RGBA pixels, row-major. */
function encodePng(rgba, size) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8 // bit depth
  header[9] = 6 // colour type: RGBA
  // 10..12 stay zero: deflate, adaptive filtering, no interlace.

  // Each scanline is prefixed with its filter type (0 = none).
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0
    rgba.subarray(y * size * 4, (y + 1) * size * 4).forEach((value, i) => {
      raw[rowStart + 1 + i] = value
    })
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ------------------------------------------------------------------ drawing

function insideRoundedRect(x, y, size, radius) {
  const dx = Math.max(radius - x, 0, x - (size - radius))
  const dy = Math.max(radius - y, 0, y - (size - radius))
  return Math.hypot(dx, dy) <= radius
}

function insideTriangle(px, py, [ax, ay], [bx, by], [cx, cy]) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by)
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy)
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay)
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0
  return !(hasNeg && hasPos)
}

/**
 * Returns the colour at a point, or null for transparent.
 * `scale` shrinks the foreground toward the centre for maskable icons, whose
 * outer 20% can be cropped away by the launcher.
 */
function sample(x, y, size, { maskable }) {
  const scale = maskable ? 0.62 : 1
  const centre = size / 2
  // Map the sample back into unscaled artwork space.
  const ax = (x - centre) / scale + centre
  const ay = (y - centre) / scale + centre

  const u = ax / size
  const v = ay / size

  // Sun.
  if (Math.hypot(u - 0.70, v - 0.32) <= 0.11) return SUN

  // Two overlapping peaks.
  const back = insideTriangle(u, v, [0.60, 0.30], [0.94, 0.78], [0.30, 0.78])
  const front = insideTriangle(u, v, [0.36, 0.38], [0.72, 0.78], [0.06, 0.78])
  if (front) return SNOW
  if (back) return DEEP

  // Ground line.
  if (v > 0.78 && v < 0.84 && u > 0.06 && u < 0.94) return SNOW

  if (maskable) return EMERALD
  return insideRoundedRect(x, y, size, size * 0.22) ? EMERALD : null
}

function render(size, options) {
  const rgba = new Uint8Array(size * size * 4)
  const SS = 3 // supersampling grid per axis, for cheap antialiasing

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const colour = sample(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS, size, options)
          if (colour) {
            r += colour[0]
            g += colour[1]
            b += colour[2]
            a += 255
          }
        }
      }

      const samples = SS * SS
      const i = (y * size + x) * 4
      // Pre-averaged over covered samples only, so edges blend instead of darkening.
      const covered = a / 255
      rgba[i] = covered ? Math.round(r / covered) : 0
      rgba[i + 1] = covered ? Math.round(g / covered) : 0
      rgba[i + 2] = covered ? Math.round(b / covered) : 0
      rgba[i + 3] = Math.round(a / samples)
    }
  }

  return encodePng(rgba, size)
}

// --------------------------------------------------------------------- main

mkdirSync(OUT_DIR, { recursive: true })

const targets = [
  ['icon-192.png', 192, { maskable: false }],
  ['icon-512.png', 512, { maskable: false }],
  ['icon-maskable-512.png', 512, { maskable: true }],
  ['apple-touch-icon.png', 180, { maskable: true }],
]

for (const [name, size, options] of targets) {
  const png = render(size, options)
  writeFileSync(join(OUT_DIR, name), png)
  console.log(`wrote icons/${name} (${size}x${size}, ${(png.length / 1024).toFixed(1)} kB)`)
}
