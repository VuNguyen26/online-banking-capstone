import type {
  TranslationKey,
} from './translations'

const PROVIDER_ERROR_KEYS:
  Readonly<Record<string, TranslationKey>> = {
    'The request was rejected in your wallet.':
      'walletErrorRequestRejected',
    'Unable to read the browser wallet state.':
      'walletErrorReadState',
    'No EIP-1193 browser wallet was detected.':
      'walletErrorNotDetected',
    'Unable to connect the browser wallet.':
      'walletErrorConnect',
    'Unable to switch to Ethereum Sepolia.':
      'walletErrorSwitchSepolia',
    'Connect your wallet before sending a transaction.':
      'walletErrorConnectBeforeTransaction',
    'Switch your wallet to Ethereum Sepolia before sending a transaction.':
      'walletErrorSwitchBeforeTransaction',
    'Unable to load SafeBank data from Ethereum Sepolia.':
      'safeBankReadErrorFallback',
  }

export function localizeProviderError(
  error: string | null,
  t: (key: TranslationKey) => string,
): string | null {
  if (error === null) {
    return null
  }

  const key = PROVIDER_ERROR_KEYS[error]

  return key ? t(key) : error
}
