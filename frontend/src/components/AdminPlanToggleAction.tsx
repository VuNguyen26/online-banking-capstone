import {
  useState,
} from 'react'
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
import {
  ConfirmationDialog,
} from './ConfirmationDialog'

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
  const [
    disableConfirmationOpen,
    setDisableConfirmationOpen,
  ] = useState(false)

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
          if (plan.enabled) {
            setDisableConfirmationOpen(true)
            return
          }

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

      <ConfirmationDialog
        open={
          plan.enabled &&
          disableConfirmationOpen
        }
        title={t(
          'adminDisablePlanConfirmationTitle',
        )}
        description={t(
          'adminDisablePlanConfirmationDescription',
        )}
        confirmLabel={t(
          'confirmationContinueToWallet',
        )}
        cancelLabel={t(
          'confirmationCancel',
        )}
        tone="danger"
        onCancel={() => {
          setDisableConfirmationOpen(false)
        }}
        onConfirm={() => {
          setDisableConfirmationOpen(false)
          void handleToggle()
        }}
      >
        <dl>
          <div>
            <dt>{t('confirmationPlanId')}</dt>
            <dd>#{plan.planId.toString()}</dd>
          </div>

          <div>
            <dt>
              {t('confirmationCurrentStatus')}
            </dt>
            <dd>
              {t('adminPlanStatusEnabled')}
            </dd>
          </div>

          <div>
            <dt>
              {t('confirmationNewStatus')}
            </dt>
            <dd>
              {t('adminPlanStatusDisabled')}
            </dd>
          </div>
        </dl>
      </ConfirmationDialog>
    </div>
  )
}