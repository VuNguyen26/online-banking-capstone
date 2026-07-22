import type {
  JsonRpcSigner,
} from 'ethers'

import {
  createSignerContracts,
} from '../contracts/client'
import type {
  PendingInterestState,
} from '../contracts/models'
import {
  claimDepositPendingInterest,
} from '../contracts/write'
import {
  getTransactionExplorerUrl,
} from '../config/network'
import {
  useTransaction,
} from '../hooks/useTransaction'
import {
  localizeTransactionError,
} from '../i18n/transactionErrors'
import { useLanguage } from '../i18n/useLanguage'
import type {
  TranslationKey,
} from '../i18n/translations'
import {
  canClaimPendingInterest,
} from '../lib/depositActions'
import type {
  TransactionState,
} from '../lib/transaction'
import type {
  SafeBankDataContextValue,
} from '../providers/safebank-data-context'
import type {
  WalletContextValue,
} from '../providers/wallet-context'

export type PendingInterestClaimContracts = {
  savingCore: unknown
}

export type CreatePendingInterestClaimContracts = (
  signer: JsonRpcSigner,
) => PendingInterestClaimContracts

type PendingInterestClaimActionProps = {
  wallet: WalletContextValue
  safeBank: SafeBankDataContextValue
  claim: PendingInterestState
  savingCorePaused: boolean
  createWriteContracts?:
    CreatePendingInterestClaimContracts
}

function createDefaultWriteContracts(
  signer: JsonRpcSigner,
): PendingInterestClaimContracts {
  const contracts =
    createSignerContracts(signer)

  return {
    savingCore:
      contracts.savingCore,
  }
}

function getTransactionStatusText(
  state: TransactionState,
  t: (key: TranslationKey) => string,
): string {
  switch (state.phase) {
    case 'idle':
      return ''
    case 'awaiting-signature':
      return t('claimAwaitingSignature')
    case 'submitted':
      return t('claimSubmitted')
    case 'confirming':
      return t('claimConfirming')
    case 'confirmed':
      return t('claimConfirmed')
    case 'failed':
      return (
        localizeTransactionError(
          state.error,
          t,
        ) ?? t('claimFailed')
      )
  }
}

export function PendingInterestClaimAction({
  wallet,
  safeBank,
  claim,
  savingCorePaused,
  createWriteContracts =
    createDefaultWriteContracts,
}: PendingInterestClaimActionProps) {
  const transaction =
    useTransaction()
  const { t } = useLanguage()

  const accountIsClaimant =
    wallet.account !== null &&
    canClaimPendingInterest(
      claim,
      wallet.account,
      false,
    )

  if (!accountIsClaimant) {
    return null
  }

  const walletReady =
    wallet.isConnected &&
    wallet.isSepolia

  const canSubmit =
    walletReady &&
    !savingCorePaused &&
    !transaction.isPending

  const handleClaim = async () => {
    if (!canSubmit) {
      return
    }

    const result =
      await transaction.execute(
        async () => {
          const signer =
            await wallet.getSigner()

          const contracts =
            createWriteContracts(
              signer,
            )

          return claimDepositPendingInterest(
            contracts.savingCore,
            claim.depositId,
          )
        },
      )

    if (result) {
      await safeBank.refresh()
    }
  }

  return (
    <div className="claim-action">
      <button
        className="secondary-button"
        type="button"
        disabled={!canSubmit}
        aria-label={`${t('claimPendingInterest')} ${claim.depositId.toString()}`}
        onClick={() => {
          void handleClaim()
        }}
      >
        {transaction.isPending
          ? t('claimingInterest')
          : t('claimDeferredInterest')}
      </button>

      {wallet.isConnected &&
        !wallet.isSepolia && (
          <p className="form-guidance">
            {t('switchBeforeClaim')}
          </p>
        )}

      {savingCorePaused && (
        <p className="form-guidance">
          {t('claimsPaused')}
        </p>
      )}

      {transaction.state.phase !==
        'idle' && (
        <div
          className={
            transaction.state.phase ===
            'failed'
              ? 'transaction-feedback transaction-failed'
              : 'transaction-feedback'
          }
          role={
            transaction.state.phase ===
            'failed'
              ? 'alert'
              : 'status'
          }
          aria-live="polite"
        >
          <strong>
            {t('deferredInterestClaim')}
          </strong>

          <span>
            {getTransactionStatusText(
              transaction.state,
              t,
            )}
          </span>

          {transaction.state.hash && (
            <a
              href={getTransactionExplorerUrl(
                transaction.state.hash,
              )}
              target="_blank"
              rel="noreferrer"
            >
              {t('viewTransaction')}
            </a>
          )}
        </div>
      )}
    </div>
  )
}
