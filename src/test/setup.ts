import '@testing-library/jest-dom/vitest'

// jsdom implements neither of these, and the image picker relies on both.
if (!URL.createObjectURL) {
  let counter = 0
  URL.createObjectURL = () => `blob:mock/${++counter}`
  URL.revokeObjectURL = () => {}
}

if (!globalThis.crypto?.randomUUID) {
  let counter = 0
  Object.defineProperty(globalThis, 'crypto', {
    value: { ...globalThis.crypto, randomUUID: () => `uuid-${++counter}` },
    configurable: true,
  })
}

// jsdom has no layout engine, so smooth-scrolling into view is a no-op here.
Element.prototype.scrollIntoView = () => {}
