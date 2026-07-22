import type { JsonRpcSigner } from 'ethers'

import { createSignerContracts } from '../contracts/client'
import { mintMockUsdc } from '../contracts/write'
import { useTransaction } from '../hooks/useTransaction'
import {
  localizeTransactionError,
} from '../i18n/transactionErrors'
import { useLanguage } from '../i18n/useLanguage'
import { parseMusdcAmount } from '../lib/units'
import type { SafeBankDataContextValue } from '../providers/safebank-data-context'
import type { WalletContextValue } from '../providers/wallet-context'

const FAUCET_AMOUNT = parseMusdcAmount('1000')

type FaucetWallet = Pick<
  WalletContextValue,
  'isConnected' | 'isSepolia' |
  'account' | 'getSigner'
>

type FaucetSafeBank = Pick<
  SafeBankDataContextValue,
  'refresh'
>

type Props = {
  wallet: FaucetWallet
  safeBank: FaucetSafeBank
  createContracts?: (
    signer: JsonRpcSigner,
  ) => { mockUsdc: unknown }
}

export function TestTokenFaucet({
  wallet,
  safeBank,
  createContracts = (signer) => ({
    mockUsdc:
      createSignerContracts(signer).mockUsdc,
  }),
}: Props) {
  const transaction = useTransaction()
  const { t } = useLanguage()

  const enabled =
    wallet.isConnected &&
    wallet.isSepolia &&
    wallet.account !== null &&
    !transaction.isPending

  const mint = async () => {
    if (!enabled || wallet.account === null) {
      return
    }

    const account = wallet.account

    const result = await transaction.execute(
      async () => {
        const signer = await wallet.getSigner()
        const contracts =
          createContracts(signer)

        return mintMockUsdc(
          contracts.mockUsdc,
          account,
          FAUCET_AMOUNT,
        )
      },
    )

    if (result) {
      await safeBank.refresh()
    }
  }

  return (
    <div className="test-token-faucet">
      <button
        type="button"
        className="secondary-button"
        disabled={!enabled}
        onClick={() => void mint()}
      >
        {transaction.isPending
          ? t('faucetMinting')
          : t('faucetMint')}
      </button>

      <p className="supporting-copy">
        {t('faucetDescription')}
      </p>

      {transaction.state.phase ===
        'confirmed' && (
        <p role="status">
          {t('faucetSuccess')}
        </p>
      )}

      {transaction.state.phase ===
        'failed' && (
        <p role="alert">
          {localizeTransactionError(
            transaction.state.error,
            t,
          ) ?? t('transactionFailed')}
        </p>
      )}
    </div>
  )
}
