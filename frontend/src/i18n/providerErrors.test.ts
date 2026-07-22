import {
  translations,
} from './translations'
import {
  localizeProviderError,
} from './providerErrors'

const translateVi = (
  key: keyof typeof translations.vi,
) => translations.vi[key]

describe('provider error localization', () => {
  it('localizes fixed wallet errors', () => {
    expect(
      localizeProviderError(
        'No EIP-1193 browser wallet was detected.',
        translateVi,
      ),
    ).toBe(
      translations.vi.walletErrorNotDetected,
    )
  })

  it('localizes the SafeBank read fallback', () => {
    expect(
      localizeProviderError(
        'Unable to load SafeBank data from Ethereum Sepolia.',
        translateVi,
      ),
    ).toBe(
      translations.vi.safeBankReadErrorFallback,
    )
  })

  it('preserves external provider errors', () => {
    expect(
      localizeProviderError(
        'Sepolia RPC unavailable',
        translateVi,
      ),
    ).toBe('Sepolia RPC unavailable')
  })

  it('preserves a null error state', () => {
    expect(
      localizeProviderError(
        null,
        translateVi,
      ),
    ).toBeNull()
  })
})
