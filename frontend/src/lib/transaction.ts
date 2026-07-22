export type TransactionPhase =
  | 'idle'
  | 'awaiting-signature'
  | 'submitted'
  | 'confirming'
  | 'confirmed'
  | 'failed'

export type TransactionState = {
  phase: TransactionPhase
  hash: string | null
  error: string | null
}

export const INITIAL_TRANSACTION_STATE:
  TransactionState = {
    phase: 'idle',
    hash: null,
    error: null,
  }

export type TransactionAction =
  | {
      type: 'REQUEST_SIGNATURE'
    }
  | {
      type: 'SUBMITTED'
      hash: string
    }
  | {
      type: 'CONFIRMING'
    }
  | {
      type: 'CONFIRMED'
    }
  | {
      type: 'FAILED'
      error: string
      hash?: string | null
    }
  | {
      type: 'RESET'
    }

export function transactionReducer(
  state: TransactionState,
  action: TransactionAction,
): TransactionState {
  switch (action.type) {
    case 'REQUEST_SIGNATURE':
      return {
        phase: 'awaiting-signature',
        hash: null,
        error: null,
      }

    case 'SUBMITTED':
      return {
        phase: 'submitted',
        hash: action.hash,
        error: null,
      }

    case 'CONFIRMING':
      if (!state.hash) {
        throw new Error(
          'A transaction hash is required before confirmation.',
        )
      }

      return {
        phase: 'confirming',
        hash: state.hash,
        error: null,
      }

    case 'CONFIRMED':
      if (!state.hash) {
        throw new Error(
          'A transaction hash is required before confirmation.',
        )
      }

      return {
        phase: 'confirmed',
        hash: state.hash,
        error: null,
      }

    case 'FAILED':
      return {
        phase: 'failed',
        hash:
          action.hash === undefined
            ? state.hash
            : action.hash,
        error: action.error,
      }

    case 'RESET':
      return INITIAL_TRANSACTION_STATE
  }
}
