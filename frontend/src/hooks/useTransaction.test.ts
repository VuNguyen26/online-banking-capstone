import {
  act,
  renderHook,
  waitFor,
} from '@testing-library/react'
import { vi } from 'vitest'

import {
  useTransaction,
  type SubmittedTransactionLike,
  type TransactionReceiptLike,
} from './useTransaction'

const TRANSACTION_HASH =
  `0x${'a'.repeat(64)}`

function createDeferred<T>() {
  let resolve!: (
    value: T | PromiseLike<T>,
  ) => void

  let reject!: (
    reason?: unknown,
  ) => void

  const promise = new Promise<T>(
    (
      promiseResolve,
      promiseReject,
    ) => {
      resolve = promiseResolve
      reject = promiseReject
    },
  )

  return {
    promise,
    resolve,
    reject,
  }
}

describe('useTransaction', () => {
  it('waits for a successful receipt before confirming', async () => {
    const submittedTransaction =
      createDeferred<SubmittedTransactionLike>()

    const receipt =
      createDeferred<TransactionReceiptLike | null>()

    const wait = vi.fn(
      () => receipt.promise,
    )

    const sendTransaction = vi.fn(
      () => submittedTransaction.promise,
    )

    const { result } = renderHook(
      () => useTransaction(),
    )

    let execution:
      Promise<unknown> | undefined

    act(() => {
      execution =
        result.current.execute(
          sendTransaction,
        )
    })

    expect(
      result.current.state.phase,
    ).toBe('awaiting-signature')

    expect(
      result.current.isPending,
    ).toBe(true)

    await act(async () => {
      submittedTransaction.resolve({
        hash: TRANSACTION_HASH,
        wait,
      })
    })

    await waitFor(() => {
      expect(
        result.current.state.phase,
      ).toBe('confirming')
    })

    expect(
      result.current.state.hash,
    ).toBe(TRANSACTION_HASH)

    expect(wait).toHaveBeenCalledTimes(1)

    let executionResult: unknown

    await act(async () => {
      receipt.resolve({
        status: 1,
      })

      executionResult = await execution
    })

    expect(executionResult).toEqual({
      hash: TRANSACTION_HASH,
      receipt: {
        status: 1,
      },
    })

    await waitFor(() => {
      expect(
        result.current.state.phase,
      ).toBe('confirmed')
    })

    expect(
      result.current.isPending,
    ).toBe(false)
  })

  it('normalizes wallet signature rejection', async () => {
    const sendTransaction = vi.fn(
      async () => {
        throw {
          code: 4001,
          message: 'User rejected',
        }
      },
    )

    const { result } = renderHook(
      () => useTransaction(),
    )

    await act(async () => {
      await result.current.execute(
        sendTransaction,
      )
    })

    expect(result.current.state).toEqual({
      phase: 'failed',
      hash: null,
      error:
        'The transaction was rejected in your wallet.',
    })
  })

  it('retains the hash when a mined transaction reverts', async () => {
    const sendTransaction = vi.fn(
      async (): Promise<SubmittedTransactionLike> => ({
        hash: TRANSACTION_HASH,
        wait: async () => ({
          status: 0,
        }),
      }),
    )

    const { result } = renderHook(
      () => useTransaction(),
    )

    await act(async () => {
      await result.current.execute(
        sendTransaction,
      )
    })

    expect(result.current.state).toEqual({
      phase: 'failed',
      hash: TRANSACTION_HASH,
      error:
        'The transaction was mined but reverted.',
    })
  })

  it('fails safely when no receipt is returned', async () => {
    const sendTransaction = vi.fn(
      async (): Promise<SubmittedTransactionLike> => ({
        hash: TRANSACTION_HASH,
        wait: async () => null,
      }),
    )

    const { result } = renderHook(
      () => useTransaction(),
    )

    await act(async () => {
      await result.current.execute(
        sendTransaction,
      )
    })

    expect(result.current.state).toEqual({
      phase: 'failed',
      hash: TRANSACTION_HASH,
      error:
        'The transaction receipt could not be loaded.',
    })
  })

  it('rejects malformed transaction hashes', async () => {
    const sendTransaction = vi.fn(
      async (): Promise<SubmittedTransactionLike> => ({
        hash: '0xinvalid',
        wait: async () => ({
          status: 1,
        }),
      }),
    )

    const { result } = renderHook(
      () => useTransaction(),
    )

    await act(async () => {
      await result.current.execute(
        sendTransaction,
      )
    })

    expect(result.current.state).toEqual({
      phase: 'failed',
      hash: null,
      error:
        'The wallet returned an invalid transaction hash.',
    })
  })

  it('prevents concurrent execution and supports reset', async () => {
    const submittedTransaction =
      createDeferred<SubmittedTransactionLike>()

    const sendTransaction = vi.fn(
      () => submittedTransaction.promise,
    )

    const { result } = renderHook(
      () => useTransaction(),
    )

    let firstExecution:
      Promise<unknown> | undefined

    let secondExecution:
      Promise<unknown> | undefined

    act(() => {
      firstExecution =
        result.current.execute(
          sendTransaction,
        )

      secondExecution =
        result.current.execute(
          sendTransaction,
        )
    })

    await expect(
      secondExecution,
    ).resolves.toBeNull()

    expect(
      sendTransaction,
    ).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.reset()
    })

    expect(
      result.current.state.phase,
    ).toBe('awaiting-signature')

    let firstExecutionResult: unknown

    await act(async () => {
      submittedTransaction.reject(
        new Error('Provider unavailable'),
      )

      firstExecutionResult =
        await firstExecution
    })

    expect(
      firstExecutionResult,
    ).toBeNull()

    await waitFor(() => {
      expect(
        result.current.state.phase,
      ).toBe('failed')
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.state).toEqual({
      phase: 'idle',
      hash: null,
      error: null,
    })
  })
})
