import {
  getTransactionExplorerUrl,
} from '../config/network'
import {
  useLanguage,
} from '../i18n/useLanguage'
import {
  localizeTransactionError,
} from '../i18n/transactionErrors'
import type {
  TranslationKey,
} from '../i18n/translations'
import type {
  TransactionState,
} from '../lib/transaction'

type AdminTransactionFeedbackProps = {
  label: string
  state: TransactionState
}

function getTransactionStatusText(
  state: TransactionState,
  t: (key: TranslationKey) => string,
): string {
  switch (state.phase) {
    case 'idle':
      return ''

    case 'awaiting-signature':
      return t(
        'transactionAwaitingSignature',
      )

    case 'submitted':
      return t(
        'transactionSubmitted',
      )

    case 'confirming':
      return t(
        'transactionConfirming',
      )

    case 'confirmed':
      return t(
        'transactionConfirmed',
      )

    case 'failed':
      return (
        localizeTransactionError(
          state.error,
          t,
        ) ??
        t('transactionFailed')
      )
  }
}

export function AdminTransactionFeedback({
  label,
  state,
}: AdminTransactionFeedbackProps) {
  const { t } = useLanguage()

  if (state.phase === 'idle') {
    return null
  }

  const failed =
    state.phase === 'failed'

  return (
    <div
      className={
        failed
          ? 'transaction-feedback transaction-failed'
          : 'transaction-feedback'
      }
      role={failed ? 'alert' : 'status'}
      aria-live="polite"
    >
      <strong>{label}</strong>

      <span>
        {getTransactionStatusText(
          state,
          t,
        )}
      </span>

      {state.hash ? (
        <a
          href={getTransactionExplorerUrl(
            state.hash,
          )}
          target="_blank"
          rel="noreferrer"
        >
          {t('viewTransaction')}
        </a>
      ) : null}
    </div>
  )
}