import {
  translations,
} from './translations'
import {
  localizeTransactionError,
} from './transactionErrors'

const translateVi = (
  key: keyof typeof translations.vi,
) => translations.vi[key]

describe('transaction error localization', () => {
  it('localizes fixed internal errors', () => {
    expect(
      localizeTransactionError(
        'The transaction was rejected in your wallet.',
        translateVi,
      ),
    ).toBe(
      translations.vi.transactionErrorRejected,
    )
  })

  it('preserves external provider messages', () => {
    expect(
      localizeTransactionError(
        'execution reverted: PlanNotEnabled',
        translateVi,
      ),
    ).toBe(
      'execution reverted: PlanNotEnabled',
    )
  })

  it('preserves an empty error state', () => {
    expect(
      localizeTransactionError(
        null,
        translateVi,
      ),
    ).toBeNull()
  })
})
