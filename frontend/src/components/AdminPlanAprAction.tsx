import {
  useState,
} from 'react'
import type {
  JsonRpcSigner,
} from 'ethers'

import {
  createSignerContracts,
} from '../contracts/client'
import type {
  SavingPlan,
} from '../contracts/models'
import {
  updateSavingPlanApr,
} from '../contracts/adminWrite'
import {
  useTransaction,
} from '../hooks/useTransaction'
import {
  useLanguage,
} from '../i18n/useLanguage'
import {
  formatBasisPoints,
  parsePercentageToBasisPoints,
} from '../lib/basisPoints'
import type {
  WalletContextValue,
} from '../providers/wallet-context'
import {
  AdminTransactionFeedback,
} from './AdminTransactionFeedback'

export type CreateAdminPlanAprContracts = (
  signer: JsonRpcSigner,
) => {
  savingCore: unknown
}

type AdminPlanAprActionProps = {
  plan: SavingPlan
  wallet: WalletContextValue
  isSavingCoreOwner: boolean
  refresh: () => Promise<void>
  createWriteContracts?:
    CreateAdminPlanAprContracts
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

export function AdminPlanAprAction({
  plan,
  wallet,
  isSavingCoreOwner,
  refresh,
  createWriteContracts =
    createDefaultWriteContracts,
}: AdminPlanAprActionProps) {
  const { t } = useLanguage()

  const [aprInput, setAprInput] =
    useState(
      formatBasisPoints(
        plan.aprBps,
      ).replace('%', ''),
    )

  const transaction = useTransaction()

  let parsedApr: bigint | null = null
  let validationError: string | null = null

  try {
    parsedApr =
      parsePercentageToBasisPoints(
        aprInput,
      )

    if (
      parsedApr <= 0n ||
      parsedApr > 10_000n
    ) {
      validationError =
        t('adminAprRangeError')
    } else if (
      parsedApr === plan.aprBps
    ) {
      validationError =
        t('adminAprUnchanged')
    }
  } catch {
    validationError =
      t('adminAprFormatError')
  }

  const canSubmit =
    wallet.isConnected &&
    wallet.isSepolia &&
    isSavingCoreOwner &&
    parsedApr !== null &&
    validationError === null &&
    !transaction.isPending

  const handleSubmit = async () => {
    if (
      !canSubmit ||
      parsedApr === null
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

          return updateSavingPlanApr(
            contracts.savingCore,
            plan.planId,
            parsedApr,
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
    <div className="admin-apr-action">
      <label
        htmlFor={`admin-plan-${plan.planId}-apr-input`}
      >
        {t('adminNewApr')}
      </label>

      <div className="admin-inline-form">
        <input
          id={`admin-plan-${plan.planId}-apr-input`}
          type="text"
          inputMode="decimal"
          value={aprInput}
          disabled={transaction.isPending}
          onChange={(event) => {
            setAprInput(
              event.target.value,
            )
            transaction.reset()
          }}
        />

        <span aria-hidden="true">
          %
        </span>

        <button
          type="button"
          className="secondary-button"
          disabled={!canSubmit}
          onClick={() => {
            void handleSubmit()
          }}
        >
          {transaction.isPending
            ? t('adminPlanUpdating')
            : t('adminUpdateApr')}
        </button>
      </div>

      {guidance ? (
        <p className="form-guidance">
          {guidance}
        </p>
      ) : null}

      {!guidance &&
      aprInput.length > 0 &&
      validationError ? (
        <p
          className="form-error"
          role="alert"
        >
          {validationError}
        </p>
      ) : null}

      <AdminTransactionFeedback
        label={t('adminAprUpdate')}
        state={transaction.state}
      />
    </div>
  )
}