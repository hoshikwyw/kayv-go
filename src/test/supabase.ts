import type { Post } from '../types/database'

export type QueryResult = {
  data?: unknown
  error?: { message: string } | null
  count?: number | null
}

export type RecordedCall = { method: string; args: unknown[] }

export type MockQuery = {
  __calls: RecordedCall[]
  [key: string]: unknown
}

/**
 * A stand-in for a PostgREST query builder.
 *
 * Every method call is recorded and returns the same object, so any chain
 * works without listing the methods up front - `.select().order().range()`,
 * `.insert().select().single()`, `.delete().eq()`. Awaiting anywhere in the
 * chain resolves to the supplied result.
 */
export function createQuery(result: QueryResult = {}): MockQuery {
  const calls: RecordedCall[] = []
  const resolved = { data: null, error: null, count: null, ...result }

  const proxy: MockQuery = new Proxy({} as MockQuery, {
    get(_target, property) {
      if (property === '__calls') return calls
      if (property === 'then') {
        return (onFulfilled?: (value: unknown) => unknown, onRejected?: () => unknown) =>
          Promise.resolve(resolved).then(onFulfilled, onRejected)
      }
      if (typeof property === 'symbol') return undefined

      return (...args: unknown[]) => {
        calls.push({ method: String(property), args })
        return proxy
      }
    },
  })

  return proxy
}

/** First recorded call to `method`, for asserting on payloads. */
export function callTo(query: MockQuery, method: string): RecordedCall | undefined {
  return query.__calls.find((call) => call.method === method)
}

let postCounter = 0

export function makePost(overrides: Partial<Post> = {}): Post {
  postCounter += 1
  return {
    id: `post-${postCounter}`,
    user_id: 'user-1',
    title: `Post ${postCounter}`,
    content: 'Something worth the detour.',
    category: 'restaurant',
    location_name: 'Busan',
    rating: 4,
    image_urls: [],
    created_at: '2026-01-0'.concat(String((postCounter % 9) + 1), 'T10:00:00Z'),
    ...overrides,
  }
}
