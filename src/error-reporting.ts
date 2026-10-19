export type ClientErrorContext =
  | 'render-error'
  | 'window-error'
  | 'unhandled-rejection'

export function reportClientError(context: ClientErrorContext, error: unknown) {
  console.error(`[client-error:${context}]`, error)
}
