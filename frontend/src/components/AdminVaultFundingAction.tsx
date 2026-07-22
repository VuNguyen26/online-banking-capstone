import {
  useState,
} from 'react'
import type {
  JsonRpcSigner,
} from 'ethers'

import {
  approveVaultManagerFunding,
  fundInterestVault,
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

export type CreateAdminVaultFundingContracts = (
  signer: JsonRpcSigner,
) => {
  mockUsdc: unknown
  vaultManager: unknown
}

type AdminVaultFundingActionProps = {
  wallet: WalletContextValue
  isVaultManagerOwner: boolean
  tokenBalance: bigint | null
  vaultAllowance: bigint | null
  refresh: () => Promise<void>
  createWriteContracts?:
    CreateAdminVaultFundingContracts
}

function createDefaultWriteContracts(
  signer: JsonRpcSigner,
): {
  mockUsdc: unknown
  vaultManager: unknown
} {
  const contracts =
    createSignerContracts(signer)

  return {
    mockUsdc: contracts.mockUsdc,
    vaultManager:
      contracts.vaultManager,
  }
}

export function AdminVaultFundingAction({
  wallet,
  isVaultManagerOwner,
  tokenBalance,
  vaultAllowance,
  refresh,
  createWriteContracts =
    createDefaultWriteContracts,
}: AdminVaultFundingActionProps) {
  const { t } = useLanguage()

  const [amountInput, setAmountInput] =
    useState('')

  const approvalTransaction =
    useTransaction()

  const fundingTransaction =
    useTransaction()

  let amount: bigint | null = null
  let validationError: string | null = null

  if (amountInput.trim().length > 0) {
    try {
      amount =
        parseMusdcAmount(amountInput)

      if (amount <= 0n) {
        validationError =
          t('adminVaultAmountPositive')
      } else if (
        tokenBalance !== null &&
        amount > tokenBalance
      ) {
        validationError =
          t('adminVaultInsufficientBalance')
      }
    } catch {
      validationError =
        t('adminVaultAmountInvalid')
    }
  }

  const needsApproval =
    amount !== null &&
    vaultAllowance !== null &&
    vaultAllowance < amount

  const transactionPending =
    approvalTransaction.isPending ||
    fundingTransaction.isPending

  const canSubmit =
    wallet.isConnected &&
    wallet.isSepolia &&
    isVaultManagerOwner &&
    tokenBalance !== null &&
    vaultAllowance !== null &&
    amount !== null &&
    validationError === null &&
    !transactionPending

  const handleApprove = async () => {
    if (
      !canSubmit ||
      amount === null
    ) {
      return
    }

    const result =
      await approvalTransaction.execute(
        async () => {
          const signer =
            await wallet.getSigner()

          const contracts =
            createWriteContracts(signer)

          return approveVaultManagerFunding(
            contracts.mockUsdc,
            amount,
          )
        },
      )

    if (result) {
      await refresh()
    }
  }

  const handleFund = async () => {
    if (
      !canSubmit ||
      amount === null
    ) {
      return
    }

    const result =
      await fundingTransaction.execute(
        async () => {
          const signer =
            await wallet.getSigner()

          const contracts =
            createWriteContracts(signer)

          return fundInterestVault(
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
  }

  return (
    <section
      className="admin-vault-funding"
      aria-labelledby="admin-vault-funding-heading"
    >
      <div>
        <h3 id="admin-vault-funding-heading">
          {t('adminVaultFundingHeading')}
        </h3>

        <p>
          {t('adminVaultFundingDescription')}
        </p>
      </div>

      <div className="admin-vault-funding-form">
        <label htmlFor="admin-vault-funding-amount">
          {t('adminVaultFundingAmount')}
        </label>

        <input
          id="admin-vault-funding-amount"
          type="text"
          inputMode="decimal"
          value={amountInput}
          disabled={transactionPending}
          onChange={(event) => {
            setAmountInput(
              event.target.value,
            )

            approvalTransaction.reset()
            fundingTransaction.reset()
          }}
        />

        {tokenBalance !== null ? (
          <p className="form-guidance">
            {t('adminWalletBalance')}:{' '}
            {formatMusdcAmount(
              tokenBalance,
            )}{' '}
            mUSDC
          </p>
        ) : null}

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

        {needsApproval ? (
          <button
            type="button"
            className="primary-button"
            disabled={!canSubmit}
            onClick={() => {
              void handleApprove()
            }}
          >
            {approvalTransaction.isPending
              ? t('adminApprovingVaultFunding')
              : t('adminApproveVaultFunding')}
          </button>
        ) : (
          <button
            type="button"
            className="primary-button"
            disabled={!canSubmit}
            onClick={() => {
              void handleFund()
            }}
          >
            {fundingTransaction.isPending
              ? t('adminFundingVault')
              : t('adminFundVault')}
          </button>
        )}
      </div>

      <AdminTransactionFeedback
        label={t('adminVaultFundingApproval')}
        state={approvalTransaction.state}
      />

      <AdminTransactionFeedback
        label={t('adminVaultFundingTransaction')}
        state={fundingTransaction.state}
      />
    </section>
  )
}