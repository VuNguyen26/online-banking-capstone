import {
  getTransactionErrorMessage,
} from './errors'

describe('transaction error normalization', () => {
  it('maps wallet rejection to a clear message', () => {
    expect(
      getTransactionErrorMessage({
        code: 4001,
        message: 'User rejected',
      }),
    ).toBe(
      'The transaction was rejected in your wallet.',
    )
  })

  it('prefers the ethers short message', () => {
    expect(
      getTransactionErrorMessage({
        shortMessage:
          'execution reverted: PlanNotEnabled',
        message: 'long provider message',
      }),
    ).toBe(
      'execution reverted: PlanNotEnabled',
    )
  })

  it('uses nested provider messages when available', () => {
    expect(
      getTransactionErrorMessage({
        info: {
          error: {
            message:
              'execution reverted: InvalidAmount',
          },
        },
      }),
    ).toBe(
      'execution reverted: InvalidAmount',
    )
  })

  it('returns a safe fallback for unknown values', () => {
    expect(
      getTransactionErrorMessage(null),
    ).toBe(
      'The transaction failed for an unknown reason.',
    )

    expect(
      getTransactionErrorMessage({}),
    ).toBe(
      'The transaction failed for an unknown reason.',
    )
  })
})
