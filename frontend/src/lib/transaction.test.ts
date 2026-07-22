import {
  INITIAL_TRANSACTION_STATE,
  transactionReducer,
} from './transaction'

describe('transaction lifecycle reducer', () => {
  it('moves through signature, submission and confirmation', () => {
    const awaiting = transactionReducer(
      INITIAL_TRANSACTION_STATE,
      {
        type: 'REQUEST_SIGNATURE',
      },
    )

    expect(awaiting).toEqual({
      phase: 'awaiting-signature',
      hash: null,
      error: null,
    })

    const submitted = transactionReducer(
      awaiting,
      {
        type: 'SUBMITTED',
        hash: '0xabc',
      },
    )

    expect(submitted.phase).toBe(
      'submitted',
    )

    const confirming = transactionReducer(
      submitted,
      {
        type: 'CONFIRMING',
      },
    )

    expect(confirming).toEqual({
      phase: 'confirming',
      hash: '0xabc',
      error: null,
    })

    expect(
      transactionReducer(
        confirming,
        {
          type: 'CONFIRMED',
        },
      ),
    ).toEqual({
      phase: 'confirmed',
      hash: '0xabc',
      error: null,
    })
  })

  it('does not allow confirmation without a hash', () => {
    expect(() =>
      transactionReducer(
        INITIAL_TRANSACTION_STATE,
        {
          type: 'CONFIRMING',
        },
      ),
    ).toThrow(
      'transaction hash is required',
    )

    expect(() =>
      transactionReducer(
        INITIAL_TRANSACTION_STATE,
        {
          type: 'CONFIRMED',
        },
      ),
    ).toThrow(
      'transaction hash is required',
    )
  })

  it('retains a submitted hash when confirmation fails', () => {
    const submitted = transactionReducer(
      INITIAL_TRANSACTION_STATE,
      {
        type: 'SUBMITTED',
        hash: '0xdef',
      },
    )

    expect(
      transactionReducer(
        submitted,
        {
          type: 'FAILED',
          error: 'Receipt status failed.',
        },
      ),
    ).toEqual({
      phase: 'failed',
      hash: '0xdef',
      error: 'Receipt status failed.',
    })
  })

  it('resets to the initial state', () => {
    const failed = {
      phase: 'failed' as const,
      hash: '0x123',
      error: 'Failure',
    }

    expect(
      transactionReducer(
        failed,
        {
          type: 'RESET',
        },
      ),
    ).toEqual(
      INITIAL_TRANSACTION_STATE,
    )
  })
})
