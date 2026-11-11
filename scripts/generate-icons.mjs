import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'icons')

// Rayo estilizado (coordenadas normalizadas 0..1)
const BOLT = [
  [0.58, 0.1],
  [0.26, 0.56],
  [0.47, 0.56],
  [0.4, 0.9],
  [0.74, 0.44],
  [0.53, 0.44],
]

const FROM = [0x4f, 0x46, 0xe5]
const TO = [0x93, 0x33, 0xea]

function insidePolygon(x, y, points) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i]
    const [xj, yj] = points[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

function scaledBolt(scale) {
  return BOLT.map(([x, y]) => [0.5 + (x - 0.5) * scale, 0.5 + (y - 0.5) * scale])
}

function crc32(buffer) {
  let c
  const table = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (const byte of buffer) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // profundidad de bits
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0 // filtro "None"
    pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function renderIcon({ size, rounded = true, boltScale = 1, fullBleed = false }) {
  const pixels = Buffer.alloc(size * size * 4)
  const bolt = scaledBolt(boltScale)
  const radius = rounded ? size * 0.22 : 0
  const samples = 4
  const weight = 1 / (samples * samples)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let coverage = 0
      let boltCoverage = 0

      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const px = (x + (sx + 0.5) / samples) / size
          const py = (y + (sy + 0.5) / samples) / size
          const dx = Math.min(px, 1 - px) * size
          const dy = Math.min(py, 1 - py) * size
          const inCorner =
            radius > 0 &&
            dx < radius &&
            dy < radius &&
            Math.hypot(radius - dx, radius - dy) > radius
          if (!inCorner) coverage += weight
          if (insidePolygon(px, py, bolt)) boltCoverage += weight
        }
      }

      const t = (x / size) * 0.6 + (y / size) * 0.4
      let r = FROM[0] + (TO[0] - FROM[0]) * t
      let g = FROM[1] + (TO[1] - FROM[1]) * t
      let b = FROM[2] + (TO[2] - FROM[2]) * t

      // Rayo blanco con un poco de sombra suave
      if (boltCoverage > 0) {
        const k = Math.min(1, boltCoverage)
        r = r * (1 - k) + 255 * k
        g = g * (1 - k) + 255 * k
        b = b * (1 - k) + 255 * k
      }

      const alpha = fullBleed ? 255 : Math.round(coverage * 255)
      const offset = (y * size + x) * 4
      pixels[offset] = Math.round(r)
      pixels[offset + 1] = Math.round(g)
      pixels[offset + 2] = Math.round(b)
      pixels[offset + 3] = alpha
    }
  }

  return encodePng(size, pixels)
}

mkdirSync(outDir, { recursive: true })

const icons = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'maskable-512.png', size: 512, fullBleed: true, boltScale: 0.78 },
  { file: 'apple-touch-icon.png', size: 180, fullBleed: true },
]

for (const icon of icons) {
  writeFileSync(join(outDir, icon.file), renderIcon(icon))
  console.log(`✓ public/icons/${icon.file}`)
}
