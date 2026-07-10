// Helpers for turning openapi-fetch results into plain values that throw a
// typed error on failure (so TanStack Query treats them as errors).

/** A structured per-row error returned by the provisioning endpoint. */
export interface RowError {
  sheet: string
  row: number
  field?: string
  message: string
}

export class ApiError extends Error {
  status: number
  /** The raw error body (FastAPI `detail`), for callers that need its shape. */
  detail: unknown

  constructor(status: number, message: string, detail?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }

  /** Per-row errors from the provisioning endpoint, if this is one of those. */
  get rowErrors(): RowError[] {
    const d = this.detail
    if (
      d &&
      typeof d === 'object' &&
      'errors' in d &&
      Array.isArray((d as { errors: unknown }).errors)
    ) {
      return (d as { errors: RowError[] }).errors
    }
    return []
  }
}

interface FetchResult<T> {
  data?: T
  error?: unknown
  response: Response
}

/** FastAPI returns `{ detail: string }`, a validation-error array, or (for the
 * provisioning endpoint) `{ detail: { message, errors[] } }`. */
function messageFromError(error: unknown, status: number): string {
  if (error && typeof error === 'object' && 'detail' in error) {
    const detail = (error as { detail: unknown }).detail
    if (typeof detail === 'string') return detail
    if (
      detail &&
      typeof detail === 'object' &&
      'message' in detail &&
      typeof (detail as { message: unknown }).message === 'string'
    ) {
      return (detail as { message: string }).message
    }
    if (Array.isArray(detail)) {
      const msgs = detail
        .map((d) =>
          d && typeof d === 'object' && 'msg' in d ? String(d.msg) : null,
        )
        .filter((m): m is string => m !== null)
      if (msgs.length > 0) return msgs.join('; ')
    }
  }
  return `Request failed (${status})`
}

/** Return the response body, or throw `ApiError` on a non-2xx / error result. */
export function unwrap<T>(result: FetchResult<T>): T {
  if (result.error !== undefined || result.data === undefined) {
    throw new ApiError(
      result.response.status,
      messageFromError(result.error, result.response.status),
      result.error,
    )
  }
  return result.data
}

/** For endpoints with no response body (e.g. 204 DELETE): throw on failure. */
export function ensureOk(result: FetchResult<unknown>): void {
  if (!result.response.ok) {
    throw new ApiError(
      result.response.status,
      messageFromError(result.error, result.response.status),
    )
  }
}
