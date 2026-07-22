import type {
  JsonRpcSigner,
} from 'ethers'

import {
  pauseSavingCore,
  pauseVaultManager,
  unpauseSavingCore,
  unpauseVaultManager,
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
import type {
  WalletContextValue,
} from '../providers/wallet-context'
import {
  AdminTransactionFeedback,
} from './AdminTransactionFeedback'

type ProtocolTarget =
  | 'saving-core'
  | 'vault-manager'

export type CreateAdminPauseContracts = (
  signer: JsonRpcSigner,
) => {
  savingCore: unknown
  vaultManager: unknown
}

type AdminProtocolPauseActionProps = {
  target: ProtocolTarget
  paused: boolean
  isOwner: boolean
  wallet: WalletContextValue
  refresh: () => Promise<void>
  createWriteContracts?:
    CreateAdminPauseContracts
}

function createDefaultWriteContracts(
  signer: JsonRpcSigner,
): {
  savingCore: unknown
  vaultManager: unknown
} {
  const contracts =
    createSignerContracts(signer)

  return {
    savingCore: contracts.savingCore,
    vaultManager:
      contracts.vaultManager,
  }
}

export function AdminProtocolPauseAction({
  target,
  paused,
  isOwner,
  wallet,
  refresh,
  createWriteContracts =
    createDefaultWriteContracts,
}: AdminProtocolPauseActionProps) {
  const { t } = useLanguage()
  const transaction = useTransaction()

  const isSavingCore =
    target === 'saving-core'

  const contractLabel =
    isSavingCore
      ? 'SavingCore'
      : 'VaultManager'

  const canSubmit =
    wallet.isConnected &&
    wallet.isSepolia &&
    isOwner &&
    !transaction.isPending

  const handleToggle = async () => {
    if (!canSubmit) {
      return
    }

    const result =
      await transaction.execute(
        async () => {
          const signer =
            await wallet.getSigner()

          const contracts =
            createWriteContracts(signer)

          if (isSavingCore) {
            return paused
              ? unpauseSavingCore(
                  contracts.savingCore,
                )
              : pauseSavingCore(
                  contracts.savingCore,
                )
          }

          return paused
            ? unpauseVaultManager(
                contracts.vaultManager,
              )
            : pauseVaultManager(
                contracts.vaultManager,
              )
        },
      )

    if (result) {
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
  } else if (!isOwner) {
    guidance = isSavingCore
      ? t('adminSavingCoreOwnerRequired')
      : t('adminVaultManagerOwnerRequired')
  }

  return (
    <article className="admin-pause-action">
      <div>
        <h3>{contractLabel}</h3>

        <p>
          {paused
            ? t('adminContractCurrentlyPaused')
            : t('adminContractCurrentlyActive')}
        </p>
      </div>

      <button
        type="button"
        className={
          paused
            ? 'secondary-button'
            : 'danger-button'
        }
        disabled={!canSubmit}
        onClick={() => {
          void handleToggle()
        }}
      >
        {transaction.isPending
          ? t('adminUpdatingPauseState')
          : paused
            ? t('adminUnpauseContract')
            : t('adminPauseContract')}
      </button>

      {guidance ? (
        <p className="form-guidance">
          {guidance}
        </p>
      ) : null}

      <AdminTransactionFeedback
        label={`${contractLabel} ${t(
          'adminPauseStateTransaction',
        )}`}
        state={transaction.state}
      />
    </article>
  )
}