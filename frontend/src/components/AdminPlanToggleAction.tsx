import type {
  JsonRpcSigner,
} from 'ethers'

import {
  createSignerContracts,
} from '../contracts/client'
import {
  disableSavingPlan,
  enableSavingPlan,
} from '../contracts/adminWrite'
import {
  useTransaction,
} from '../hooks/useTransaction'
import {
  useLanguage,
} from '../i18n/useLanguage'
import type {
  SavingPlan,
} from '../contracts/models'
import type {
  WalletContextValue,
} from '../providers/wallet-context'
import {
  AdminTransactionFeedback,
} from './AdminTransactionFeedback'

export type CreateAdminPlanWriteContracts = (
  signer: JsonRpcSigner,
) => {
  savingCore: unknown
}

type AdminPlanToggleActionProps = {
  plan: SavingPlan
  wallet: WalletContextValue
  isSavingCoreOwner: boolean
  refresh: () => Promise<void>
  createWriteContracts?:
    CreateAdminPlanWriteContracts
}

function createDefaultWriteContracts(
  signer: JsonRpcSigner,
): {
  savingCore: unknown
} {
  const contracts =
    createSignerContracts(signer)

  return {
    savingCore: contracts.savingCore,
  }
}

export function AdminPlanToggleAction({
  plan,
  wallet,
  isSavingCoreOwner,
  refresh,
  createWriteContracts =
    createDefaultWriteContracts,
}: AdminPlanToggleActionProps) {
  const { t } = useLanguage()
  const transaction = useTransaction()

  const canSubmit =
    wallet.isConnected &&
    wallet.isSepolia &&
    isSavingCoreOwner &&
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

          return plan.enabled
            ? disableSavingPlan(
                contracts.savingCore,
                plan.planId,
              )
            : enableSavingPlan(
                contracts.savingCore,
                plan.planId,
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
  } else if (!isSavingCoreOwner) {
    guidance =
      t('adminSavingCoreOwnerRequired')
  }

  return (
    <div className="admin-plan-action">
      <button
        type="button"
        className="secondary-button"
        disabled={!canSubmit}
        onClick={() => {
          void handleToggle()
        }}
      >
        {transaction.isPending
          ? t('adminPlanUpdating')
          : plan.enabled
            ? t('adminDisablePlan')
            : t('adminEnablePlan')}
      </button>

      {guidance ? (
        <p className="form-guidance">
          {guidance}
        </p>
      ) : null}

      <AdminTransactionFeedback
        label={t('adminPlanStatusUpdate')}
        state={transaction.state}
      />
    </div>
  )
}