import {
  useCallback,
  useReducer,
  useRef,
} from 'react'

import {
  getTransactionErrorMessage,
} from '../lib/errors'
import {
  INITIAL_TRANSACTION_STATE,
  transactionReducer,
} from '../lib/transaction'

export type TransactionReceiptLike = {
  status: number | bigint | null
}

export type SubmittedTransactionLike = {
  hash: string
  wait: () =>
    Promise<TransactionReceiptLike | null>
}

export type TransactionSender = () =>
  Promise<SubmittedTransactionLike>

export type ExecuteTransactionResult = {
  hash: string
  receipt: TransactionReceiptLike
}

function isTransactionHash(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    /^0x[0-9a-fA-F]{64}$/.test(value)
  )
}

function isSuccessfulReceipt(
  receipt: TransactionReceiptLike,
): boolean {
  return (
    receipt.status === 1 ||
    receipt.status === 1n
  )
}

export function useTransaction() {
  const [state, dispatch] = useReducer(
    transactionReducer,
    INITIAL_TRANSACTION_STATE,
  )

  const isExecuting = useRef(false)

  const execute = useCallback(
    async (
      sendTransaction: TransactionSender,
    ): Promise<ExecuteTransactionResult | null> => {
      if (isExecuting.current) {
        return null
      }

      isExecuting.current = true

      let submittedHash: string | null = null

      dispatch({
        type: 'REQUEST_SIGNATURE',
      })

      try {
        const transaction =
          await sendTransaction()

        if (
          !isTransactionHash(
            transaction.hash,
          )
        ) {
          throw new Error(
            'The wallet returned an invalid transaction hash.',
          )
        }

        submittedHash = transaction.hash

        dispatch({
          type: 'SUBMITTED',
          hash: submittedHash,
        })

        dispatch({
          type: 'CONFIRMING',
        })

        const receipt =
          await transaction.wait()

        if (!receipt) {
          throw new Error(
            'The transaction receipt could not be loaded.',
          )
        }

        if (
          !isSuccessfulReceipt(receipt)
        ) {
          throw new Error(
            'The transaction was mined but reverted.',
          )
        }

        dispatch({
          type: 'CONFIRMED',
        })

        return {
          hash: submittedHash,
          receipt,
        }
      } catch (transactionError) {
        dispatch({
          type: 'FAILED',
          error:
            getTransactionErrorMessage(
              transactionError,
            ),
          hash: submittedHash,
        })

        return null
      } finally {
        isExecuting.current = false
      }
    },
    [],
  )

  const reset = useCallback(() => {
    if (isExecuting.current) {
      return
    }

    dispatch({
      type: 'RESET',
    })
  }, [])

  const isPending =
    state.phase ===
      'awaiting-signature' ||
    state.phase === 'submitted' ||
    state.phase === 'confirming'

  return {
    state,
    isPending,
    execute,
    reset,
  }
}
