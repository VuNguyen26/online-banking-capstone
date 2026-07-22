import {
  isUserRejectedRequest,
} from './wallet'

type ErrorWithDetails = {
  shortMessage?: unknown
  reason?: unknown
  message?: unknown
  info?: {
    error?: {
      message?: unknown
    }
  }
}

function readNonEmptyString(
  value: unknown,
): string | null {
  return (
    typeof value === 'string' &&
    value.trim().length > 0
  )
    ? value.trim()
    : null
}

export function getTransactionErrorMessage(
  error: unknown,
): string {
  if (isUserRejectedRequest(error)) {
    return 'The transaction was rejected in your wallet.'
  }

  if (
    typeof error !== 'object' ||
    error === null
  ) {
    return 'The transaction failed for an unknown reason.'
  }

  const details =
    error as ErrorWithDetails

  const candidates = [
    details.shortMessage,
    details.reason,
    details.info?.error?.message,
    details.message,
  ]

  for (const candidate of candidates) {
    const message =
      readNonEmptyString(candidate)

    if (message) {
      return message
    }
  }

  return 'The transaction failed for an unknown reason.'
}
