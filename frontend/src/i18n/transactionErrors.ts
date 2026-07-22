import type {
  TranslationKey,
} from './translations'

const FIXED_TRANSACTION_ERROR_KEYS:
  Readonly<Record<string, TranslationKey>> = {
    'The transaction was rejected in your wallet.':
      'transactionErrorRejected',
    'The transaction failed for an unknown reason.':
      'transactionErrorUnknown',
    'The wallet returned an invalid transaction hash.':
      'transactionErrorInvalidHash',
    'The transaction receipt could not be loaded.':
      'transactionErrorReceiptUnavailable',
    'The transaction was mined but reverted.':
      'transactionErrorMinedReverted',
  }

export function localizeTransactionError(
  error: string | null,
  t: (key: TranslationKey) => string,
): string | null {
  if (error === null) {
    return null
  }

  const key =
    FIXED_TRANSACTION_ERROR_KEYS[error]

  return key ? t(key) : error
}
