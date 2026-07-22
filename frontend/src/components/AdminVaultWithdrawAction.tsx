import {
  useState,
} from 'react'
import type {
  JsonRpcSigner,
} from 'ethers'

import {
  withdrawInterestVault,
} from '../contracts/adminWrite'
import {
  createSignerContracts,
} from '../contracts/client'
import {
  useTransaction,
} from '../hooks/useTransaction'
import {
  useLanguage,
} from '../i18n/useLanguage'
import {
  formatMusdcAmount,
  parseMusdcAmount,
} from '../lib/units'
import type {
  WalletContextValue,
} from '../providers/wallet-context'
import {
  AdminTransactionFeedback,
} from './AdminTransactionFeedback'
import {
  ConfirmationDialog,
} from './ConfirmationDialog'

export type CreateAdminVaultWithdrawContracts = (
  signer: JsonRpcSigner,
) => {
  vaultManager: unknown
}

type AdminVaultWithdrawActionProps = {
  wallet: WalletContextValue
  isVaultManagerOwner: boolean
  vaultManagerOwner: string
  vaultPaused: boolean
  availableLiquidity: bigint
  refresh: () => Promise<void>
  createWriteContracts?:
    CreateAdminVaultWithdrawContracts
}

function createDefaultWriteContracts(
  signer: JsonRpcSigner,
): {
  vaultManager: unknown
} {
  const contracts =
    createSignerContracts(signer)

  return {
    vaultManager:
      contracts.vaultManager,
  }
}

export function AdminVaultWithdrawAction({
  wallet,
  isVaultManagerOwner,
  vaultManagerOwner,
  vaultPaused,
  availableLiquidity,
  refresh,
  createWriteContracts =
    createDefaultWriteContracts,
}: AdminVaultWithdrawActionProps) {
  const { t } = useLanguage()

  const [amountInput, setAmountInput] =
    useState('')

  const [
    withdrawConfirmationOpen,
    setWithdrawConfirmationOpen,
  ] = useState(false)

  const transaction = useTransaction()

  let amount: bigint | null = null
  let validationError: string | null = null

  if (amountInput.trim().length > 0) {
    try {
      amount =
        parseMusdcAmount(amountInput)

      if (amount <= 0n) {
        validationError =
          t('adminVaultWithdrawPositive')
      } else if (
        amount > availableLiquidity
      ) {
        validationError =
          t('adminVaultWithdrawExceedsAvailable')
      }
    } catch {
      validationError =
        t('adminVaultAmountInvalid')
    }
  }

  const canSubmit =
    wallet.isConnected &&
    wallet.isSepolia &&
    isVaultManagerOwner &&
    !vaultPaused &&
    amount !== null &&
    validationError === null &&
    !transaction.isPending

  const handleWithdraw = async () => {
    if (
      !canSubmit ||
      amount === null
    ) {
      return
    }

    const result =
      await transaction.execute(
        async () => {
          const signer =
            await wallet.getSigner()

          const contracts =
            createWriteContracts(signer)

          return withdrawInterestVault(
            contracts.vaultManager,
            amount,
          )
        },
      )

    if (result) {
      setAmountInput('')
      await refresh()
    }
  }

  let guidance: string | null = null

  if (!wallet.isConnected) {
    guidance =
      t('adminConnectWalletAction')
  } else if (!wallet.isSepolia) {
    guidance =
      t('adminSwitchSepoliaAction')
  } else if (!isVaultManagerOwner) {
    guidance =
      t('adminVaultManagerOwnerRequired')
  } else if (vaultPaused) {
    guidance =
      t('adminVaultWithdrawPaused')
  }

  return (
    <section
      className="admin-vault-withdraw"
      aria-labelledby="admin-vault-withdraw-heading"
    >
      <div>
        <h3 id="admin-vault-withdraw-heading">
          {t('adminVaultWithdrawHeading')}
        </h3>

        <p>
          {t('adminVaultWithdrawDescription')}
        </p>
      </div>

      <div className="admin-vault-withdraw-form">
        <label htmlFor="admin-vault-withdraw-amount">
          {t('adminVaultWithdrawAmount')}
        </label>

        <input
          id="admin-vault-withdraw-amount"
          type="text"
          inputMode="decimal"
          value={amountInput}
          disabled={transaction.isPending}
          onChange={(event) => {
            setAmountInput(
              event.target.value,
            )
            setWithdrawConfirmationOpen(false)
            transaction.reset()
          }}
        />

        <p className="form-guidance">
          {t('adminAvailableLiquidity')}:{' '}
          {formatMusdcAmount(
            availableLiquidity,
          )}{' '}
          mUSDC
        </p>

        {guidance ? (
          <p className="form-guidance">
            {guidance}
          </p>
        ) : null}

        {!guidance &&
        amountInput.length > 0 &&
        validationError ? (
          <p
            className="form-error"
            role="alert"
          >
            {validationError}
          </p>
        ) : null}

        <button
          type="button"
          className="secondary-button"
          disabled={!canSubmit}
          onClick={() => {
            if (!canSubmit) {
              return
            }

            setWithdrawConfirmationOpen(true)
          }}
        >
          {transaction.isPending
            ? t('adminWithdrawingVault')
            : t('adminWithdrawVault')}
        </button>
      </div>

      <AdminTransactionFeedback
        label={t('adminVaultWithdrawTransaction')}
        state={transaction.state}
      />

      {amount !== null ? (
        <ConfirmationDialog
          open={withdrawConfirmationOpen}
          title={t(
            'adminVaultWithdrawConfirmationTitle',
          )}
          description={t(
            'adminVaultWithdrawConfirmationDescription',
          )}
          confirmLabel={t(
            'confirmationContinueToWallet',
          )}
          cancelLabel={t(
            'confirmationCancel',
          )}
          tone="danger"
          onCancel={() => {
            setWithdrawConfirmationOpen(false)
          }}
          onConfirm={() => {
            setWithdrawConfirmationOpen(false)
            void handleWithdraw()
          }}
        >
          <dl>
            <div>
              <dt>{t('confirmationAmount')}</dt>
              <dd>
                {formatMusdcAmount(amount)} mUSDC
              </dd>
            </div>

            <div>
              <dt>
                {t(
                  'confirmationAvailableLiquidity',
                )}
              </dt>
              <dd>
                {formatMusdcAmount(
                  availableLiquidity,
                )}{' '}
                mUSDC
              </dd>
            </div>

            <div>
              <dt>
                {t(
                  'confirmationRemainingLiquidity',
                )}
              </dt>
              <dd>
                {formatMusdcAmount(
                  availableLiquidity - amount,
                )}{' '}
                mUSDC
              </dd>
            </div>

            <div>
              <dt>
                {t('confirmationRecipient')}
              </dt>
              <dd title={vaultManagerOwner}>
                {vaultManagerOwner}
              </dd>
            </div>
          </dl>
        </ConfirmationDialog>
      ) : null}
    </section>
  )
}