import {
  useState,
} from 'react'
import type {
  JsonRpcSigner,
} from 'ethers'

import {
  createSavingPlan,
  type CreateSavingPlanInput,
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
  TranslationKey,
} from '../i18n/translations'
import {
  parsePercentageToBasisPoints,
} from '../lib/basisPoints'
import {
  parseMusdcAmount,
} from '../lib/units'
import type {
  WalletContextValue,
} from '../providers/wallet-context'
import {
  AdminTransactionFeedback,
} from './AdminTransactionFeedback'

export type CreateAdminPlanContracts = (
  signer: JsonRpcSigner,
) => {
  savingCore: unknown
}

type AdminCreatePlanActionProps = {
  wallet: WalletContextValue
  isSavingCoreOwner: boolean
  refresh: () => Promise<void>
  createWriteContracts?:
    CreateAdminPlanContracts
}

type CreatePlanValidation = {
  input: CreateSavingPlanInput | null
  error: TranslationKey | null
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

function parseTenorDays(
  value: string,
): bigint {
  const normalized = value.trim()

  if (!/^\d+$/.test(normalized)) {
    throw new Error('Invalid tenor.')
  }

  return BigInt(normalized)
}

function validateCreatePlan(
  tenorInput: string,
  aprInput: string,
  minDepositInput: string,
  maxDepositInput: string,
  penaltyInput: string,
  enabled: boolean,
): CreatePlanValidation {
  let tenorDays: bigint

  try {
    tenorDays =
      parseTenorDays(tenorInput)
  } catch {
    return {
      input: null,
      error:
        'adminCreatePlanTenorError',
    }
  }

  if (
    tenorDays < 1n ||
    tenorDays > 3650n
  ) {
    return {
      input: null,
      error:
        'adminCreatePlanTenorError',
    }
  }

  let aprBps: bigint

  try {
    aprBps =
      parsePercentageToBasisPoints(
        aprInput,
      )
  } catch {
    return {
      input: null,
      error:
        'adminAprFormatError',
    }
  }

  if (
    aprBps < 1n ||
    aprBps > 10_000n
  ) {
    return {
      input: null,
      error:
        'adminAprRangeError',
    }
  }

  let minDeposit: bigint
  let maxDeposit: bigint

  try {
    minDeposit =
      parseMusdcAmount(
        minDepositInput,
      )

    maxDeposit =
      parseMusdcAmount(
        maxDepositInput,
      )
  } catch {
    return {
      input: null,
      error:
        'adminCreatePlanAmountError',
    }
  }

  if (
    minDeposit <= 0n ||
    maxDeposit < minDeposit
  ) {
    return {
      input: null,
      error:
        'adminCreatePlanDepositRangeError',
    }
  }

  let earlyWithdrawPenaltyBps: bigint

  try {
    earlyWithdrawPenaltyBps =
      parsePercentageToBasisPoints(
        penaltyInput,
      )
  } catch {
    return {
      input: null,
      error:
        'adminCreatePlanPenaltyError',
    }
  }

  if (
    earlyWithdrawPenaltyBps < 0n ||
    earlyWithdrawPenaltyBps > 10_000n
  ) {
    return {
      input: null,
      error:
        'adminCreatePlanPenaltyError',
    }
  }

  return {
    input: {
      tenorDays,
      aprBps,
      minDeposit,
      maxDeposit,
      earlyWithdrawPenaltyBps,
      enabled,
    },
    error: null,
  }
}

export function AdminCreatePlanAction({
  wallet,
  isSavingCoreOwner,
  refresh,
  createWriteContracts =
    createDefaultWriteContracts,
}: AdminCreatePlanActionProps) {
  const { t } = useLanguage()

  const [tenorInput, setTenorInput] =
    useState('180')
  const [aprInput, setAprInput] =
    useState('2')
  const [
    minDepositInput,
    setMinDepositInput,
  ] = useState('100')
  const [
    maxDepositInput,
    setMaxDepositInput,
  ] = useState('10000')
  const [
    penaltyInput,
    setPenaltyInput,
  ] = useState('7.5')
  const [enabled, setEnabled] =
    useState(true)

  const transaction = useTransaction()

  const validation =
    validateCreatePlan(
      tenorInput,
      aprInput,
      minDepositInput,
      maxDepositInput,
      penaltyInput,
      enabled,
    )

  const canSubmit =
    wallet.isConnected &&
    wallet.isSepolia &&
    isSavingCoreOwner &&
    validation.input !== null &&
    !transaction.isPending

  const handleSubmit = async () => {
    const input = validation.input

    if (
      !canSubmit ||
      input === null
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

          return createSavingPlan(
            contracts.savingCore,
            input,
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

  const resetTransaction = () => {
    transaction.reset()
  }

  return (
    <section
      className="admin-create-plan"
      aria-labelledby="admin-create-plan-heading"
    >
      <div>
        <h3 id="admin-create-plan-heading">
          {t('adminCreatePlanHeading')}
        </h3>

        <p>
          {t('adminCreatePlanDescription')}
        </p>
      </div>

      <form
        className="admin-create-plan-form"
        onSubmit={(event) => {
          event.preventDefault()
          void handleSubmit()
        }}
      >
        <label>
          <span>
            {t('adminPlanTenorDays')}
          </span>

          <input
            type="text"
            inputMode="numeric"
            value={tenorInput}
            disabled={transaction.isPending}
            onChange={(event) => {
              setTenorInput(
                event.target.value,
              )
              resetTransaction()
            }}
          />
        </label>

        <label>
          <span>
            {t('adminPlanAprPercent')}
          </span>

          <input
            type="text"
            inputMode="decimal"
            value={aprInput}
            disabled={transaction.isPending}
            onChange={(event) => {
              setAprInput(
                event.target.value,
              )
              resetTransaction()
            }}
          />
        </label>

        <label>
          <span>
            {t('adminMinimumDeposit')}
          </span>

          <input
            type="text"
            inputMode="decimal"
            value={minDepositInput}
            disabled={transaction.isPending}
            onChange={(event) => {
              setMinDepositInput(
                event.target.value,
              )
              resetTransaction()
            }}
          />
        </label>

        <label>
          <span>
            {t('adminMaximumDeposit')}
          </span>

          <input
            type="text"
            inputMode="decimal"
            value={maxDepositInput}
            disabled={transaction.isPending}
            onChange={(event) => {
              setMaxDepositInput(
                event.target.value,
              )
              resetTransaction()
            }}
          />
        </label>

        <label>
          <span>
            {t('adminEarlyPenaltyPercent')}
          </span>

          <input
            type="text"
            inputMode="decimal"
            value={penaltyInput}
            disabled={transaction.isPending}
            onChange={(event) => {
              setPenaltyInput(
                event.target.value,
              )
              resetTransaction()
            }}
          />
        </label>

        <label className="admin-checkbox-field">
          <input
            type="checkbox"
            checked={enabled}
            disabled={transaction.isPending}
            onChange={(event) => {
              setEnabled(
                event.target.checked,
              )
              resetTransaction()
            }}
          />

          <span>
            {t('adminEnablePlanInitially')}
          </span>
        </label>

        {guidance ? (
          <p className="form-guidance">
            {guidance}
          </p>
        ) : null}

        {!guidance &&
        validation.error ? (
          <p
            className="form-error"
            role="alert"
          >
            {t(validation.error)}
          </p>
        ) : null}

        <button
          type="submit"
          className="primary-button"
          disabled={!canSubmit}
        >
          {transaction.isPending
            ? t('adminCreatingPlan')
            : t('adminCreatePlan')}
        </button>
      </form>

      <AdminTransactionFeedback
        label={t('adminCreatePlanTransaction')}
        state={transaction.state}
      />
    </section>
  )
}