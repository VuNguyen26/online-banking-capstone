import type {
  JsonRpcSigner,
} from 'ethers'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  createSignerContracts,
} from '../contracts/client'
import type {
  SavingPlan,
} from '../contracts/models'
import {
  approveSavingCore,
  openSavingDeposit,
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
  formatBasisPoints,
} from '../lib/basisPoints'
import {
  formatMusdcAmount,
} from '../lib/units'
import {
  validateOpenDeposit,
} from '../lib/openDeposit'
import type {
  OpenDepositErrorCode,
} from '../lib/openDeposit'
import type {
  TransactionState,
} from '../lib/transaction'
import type {
  SafeBankDataContextValue,
} from '../providers/safebank-data-context'
import type {
  WalletContextValue,
} from '../providers/wallet-context'
import {
  ConfirmationDialog,
} from './ConfirmationDialog'

export type OpenDepositWriteContracts = {
  mockUsdc: unknown
  savingCore: unknown
}

export type CreateOpenDepositWriteContracts = (
  signer: JsonRpcSigner,
) => OpenDepositWriteContracts

type OpenDepositPanelProps = {
  wallet: WalletContextValue
  safeBank: SafeBankDataContextValue
  createWriteContracts?:
    CreateOpenDepositWriteContracts
}

function createDefaultWriteContracts(
  signer: JsonRpcSigner,
): OpenDepositWriteContracts {
  const contracts =
    createSignerContracts(signer)

  return {
    mockUsdc: contracts.mockUsdc,
    savingCore: contracts.savingCore,
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
      return t('transactionAwaitingSignature')
    case 'submitted':
      return t('transactionSubmitted')
    case 'confirming':
      return t('transactionConfirming')
    case 'confirmed':
      return t('transactionConfirmed')
    case 'failed':
      return (
        localizeTransactionError(
          state.error,
          t,
        ) ?? t('transactionFailed')
      )
  }
}

const OPEN_DEPOSIT_ERROR_KEYS:
  Record<OpenDepositErrorCode, TranslationKey> = {
    'plan-required': 'openErrorPlanRequired',
    'plan-disabled': 'openErrorPlanDisabled',
    'invalid-amount': 'openErrorInvalidAmount',
    'amount-not-positive':
      'openErrorAmountNotPositive',
    'below-minimum': 'openErrorBelowMinimum',
    'above-maximum': 'openErrorAboveMaximum',
    'insufficient-balance':
      'openErrorInsufficientBalance',
  }

function getOpenDepositErrorText(
  error: OpenDepositErrorCode,
  t: (key: TranslationKey) => string,
): string {
  return t(
    OPEN_DEPOSIT_ERROR_KEYS[error],
  )
}

function TransactionFeedback({
  label,
  state,
}: {
  label: string
  state: TransactionState
}) {
  const { t } = useLanguage()

  if (state.phase === 'idle') {
    return null
  }

  return (
    <div
      className={
        state.phase === 'failed'
          ? 'transaction-feedback transaction-failed'
          : 'transaction-feedback'
      }
      role={
        state.phase === 'failed'
          ? 'alert'
          : 'status'
      }
      aria-live="polite"
    >
      <strong>{label}</strong>
      <span>
        {getTransactionStatusText(state, t)}
      </span>

      {state.hash && (
        <a
          href={getTransactionExplorerUrl(
            state.hash,
          )}
          target="_blank"
          rel="noreferrer"
        >
          {t('viewTransaction')}
        </a>
      )}
    </div>
  )
}

export function OpenDepositPanel({
  wallet,
  safeBank,
  createWriteContracts =
    createDefaultWriteContracts,
}: OpenDepositPanelProps) {
  const { t } = useLanguage()

  const [amountInput, setAmountInput] =
    useState('')
  const [selectedPlanId, setSelectedPlanId] =
    useState('')
  const [
    depositConfirmationOpen,
    setDepositConfirmationOpen,
  ] = useState(false)

  const approvalTransaction =
    useTransaction()
  const depositTransaction =
    useTransaction()

  const dashboardData =
    safeBank.status === 'ready'
      ? safeBank.data
      : null

  const enabledPlans = useMemo(
    () =>
      dashboardData?.plans.filter(
        (plan) => plan.enabled,
      ) ?? [],
    [dashboardData],
  )

  useEffect(() => {
    const selectedStillExists =
      enabledPlans.some(
        (plan) =>
          plan.planId.toString() ===
          selectedPlanId,
      )

    if (
      !selectedStillExists &&
      enabledPlans.length > 0
    ) {
      setSelectedPlanId(
        enabledPlans[0].planId.toString(),
      )
    }

    if (
      enabledPlans.length === 0 &&
      selectedPlanId !== ''
    ) {
      setSelectedPlanId('')
    }
  }, [
    enabledPlans,
    selectedPlanId,
  ])

  const selectedPlan:
    SavingPlan | null =
    enabledPlans.find(
      (plan) =>
        plan.planId.toString() ===
        selectedPlanId,
    ) ?? null

  const validation =
    validateOpenDeposit({
      amountInput,
      plan: selectedPlan,
      tokenAccountState:
        dashboardData?.tokenAccountState ??
        null,
    })

  const protocolPaused =
    dashboardData?.protocolStatus
      .savingCorePaused ?? false

  const walletReady =
    wallet.isConnected &&
    wallet.isSepolia &&
    dashboardData?.tokenAccountState !==
      null

  const transactionPending =
    approvalTransaction.isPending ||
    depositTransaction.isPending

  const canSubmit =
    walletReady &&
    !protocolPaused &&
    validation.error === null &&
    validation.amount !== null &&
    !transactionPending

  const handleApprove = async () => {
    const amount = validation.amount

    if (
      amount === null ||
      !canSubmit
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

          return approveSavingCore(
            contracts.mockUsdc,
            amount,
          )
        },
      )

    if (result) {
      await safeBank.refresh()
    }
  }

  const handleOpenDeposit = async () => {
    const amount = validation.amount
    const plan = selectedPlan

    if (
      amount === null ||
      plan === null ||
      !canSubmit
    ) {
      return
    }

    const result =
      await depositTransaction.execute(
        async () => {
          const signer =
            await wallet.getSigner()

          const contracts =
            createWriteContracts(signer)

          return openSavingDeposit(
            contracts.savingCore,
            plan.planId,
            amount,
          )
        },
      )

    if (result) {
      setAmountInput('')
      await safeBank.refresh()
    }
  }

  return (
    <section
      className="panel"
      aria-labelledby="open-deposit-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {t('openDepositEyebrow')}
          </p>
          <h2 id="open-deposit-heading">
            {t('openDepositHeading')}
          </h2>
        </div>
      </div>

      <p className="supporting-copy">
        {t('openDepositDescription')}
      </p>

      <div className="deposit-form">
        <label htmlFor="saving-plan">
          {t('savingPlan')}
        </label>

        <select
          id="saving-plan"
          value={selectedPlanId}
          disabled={
            enabledPlans.length === 0 ||
            transactionPending
          }
          onChange={(event) => {
            setSelectedPlanId(
              event.target.value,
            )
            setDepositConfirmationOpen(
              false,
            )
            depositTransaction.reset()
          }}
        >
          {enabledPlans.length === 0 && (
            <option value="">
              {t('noEnabledPlans')}
            </option>
          )}

          {enabledPlans.map((plan) => (
            <option
              key={plan.planId.toString()}
              value={plan.planId.toString()}
            >
              {t('plan')} #{plan.planId.toString()} —{' '}
              {plan.tenorDays.toString()} {t('days')}
            </option>
          ))}
        </select>

        <label htmlFor="deposit-amount">
          {t('depositAmount')}
        </label>

        <div className="amount-input">
          <input
            id="deposit-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder={t('depositAmountPlaceholder')}
            value={amountInput}
            disabled={transactionPending}
            aria-describedby="deposit-help deposit-error"
            onChange={(event) => {
              setAmountInput(
                event.target.value,
              )
              setDepositConfirmationOpen(
                false,
              )
              depositTransaction.reset()
            }}
          />
          <span>mUSDC</span>
        </div>

        <p
          id="deposit-help"
          className="supporting-copy"
        >
          {t('depositAmountHelp')}
        </p>

        {selectedPlan && (
          <dl className="deposit-preview">
            <div>
              <dt>{t('allowedRange')}</dt>
              <dd>
                {formatMusdcAmount(
                  selectedPlan.minDeposit,
                )}{' '}
                –{' '}
                {formatMusdcAmount(
                  selectedPlan.maxDeposit,
                )}{' '}
                mUSDC
              </dd>
            </div>

            <div>
              <dt>{t('estimatedInterest')}</dt>
              <dd>
                {validation.estimatedInterest ===
                null
                  ? t('enterAmountForInterestEstimate')
                  : `${formatMusdcAmount(
                      validation
                        .estimatedInterest,
                    )} mUSDC`}
              </dd>
            </div>
          </dl>
        )}

        {amountInput.length > 0 &&
          validation.error && (
            <p
              id="deposit-error"
              className="form-error"
              role="alert"
            >
              {getOpenDepositErrorText(
                validation.error,
                t,
              )}
            </p>
          )}

        {!wallet.isConnected && (
          <p className="form-guidance">
            {t('connectBeforeDeposit')}
          </p>
        )}

        {wallet.isConnected &&
          !wallet.isSepolia && (
            <p className="form-guidance">
              {t('switchBeforeTransaction')}
            </p>
          )}

        {walletReady &&
          dashboardData?.tokenAccountState
            ?.balance === 0n && (
            <p className="form-guidance">
              {t('zeroMusdcBalanceGuidance')}
            </p>
          )}
        {protocolPaused && (
          <p
            className="form-error"
            role="alert"
          >
            {t('savingCorePaused')}
          </p>
        )}

        <div className="deposit-actions">
          {validation.needsApproval ? (
            <button
              className="primary-button"
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                void handleApprove()
              }}
            >
              {approvalTransaction.isPending
                ? t('approvingMusdc')
                : t('approveExactMusdc')}
            </button>
          ) : (
            <button
              className="primary-button"
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                if (!canSubmit) {
                  return
                }

                setDepositConfirmationOpen(
                  true,
                )
              }}
            >
              {depositTransaction.isPending
                ? t('openingDeposit')
                : t('openDeposit')}
            </button>
          )}
        </div>
      </div>

      <TransactionFeedback
        label={t('musdcApproval')}
        state={approvalTransaction.state}
      />

      <TransactionFeedback
        label={t('depositOpening')}
        state={depositTransaction.state}
      />

      {selectedPlan !== null &&
      validation.amount !== null ? (
        <ConfirmationDialog
          open={depositConfirmationOpen}
          title={t(
            'openDepositConfirmationTitle',
          )}
          description={t(
            'openDepositConfirmationDescription',
          )}
          confirmLabel={t(
            'confirmationContinueToWallet',
          )}
          cancelLabel={t(
            'confirmationCancel',
          )}
          onCancel={() => {
            setDepositConfirmationOpen(false)
          }}
          onConfirm={() => {
            setDepositConfirmationOpen(false)
            void handleOpenDeposit()
          }}
        >
          <dl>
            <div>
              <dt>{t('confirmationPlanId')}</dt>
              <dd>
                #{selectedPlan.planId.toString()}
              </dd>
            </div>

            <div>
              <dt>{t('depositAmount')}</dt>
              <dd>
                {formatMusdcAmount(
                  validation.amount,
                )}{' '}
                mUSDC
              </dd>
            </div>

            <div>
              <dt>{t('confirmationTenor')}</dt>
              <dd>
                {selectedPlan.tenorDays.toString()}{' '}
                {t('days')}
              </dd>
            </div>

            <div>
              <dt>
                {t('confirmationNewApr')}
              </dt>
              <dd>
                {formatBasisPoints(
                  selectedPlan.aprBps,
                )}
              </dd>
            </div>

            <div>
              <dt>{t('estimatedInterest')}</dt>
              <dd>
                {validation.estimatedInterest ===
                null
                  ? t('enterAmountForInterestEstimate')
                  : `${formatMusdcAmount(
                      validation
                        .estimatedInterest,
                    )} mUSDC`}
              </dd>
            </div>

            <div>
              <dt>{t('earlyPenalty')}</dt>
              <dd>
                {formatBasisPoints(
                  selectedPlan
                    .earlyWithdrawPenaltyBps,
                )}
              </dd>
            </div>
          </dl>
        </ConfirmationDialog>
      ) : null}
    </section>
  )
}
