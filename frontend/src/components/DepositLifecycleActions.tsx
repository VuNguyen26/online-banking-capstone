import type {
  JsonRpcSigner,
} from 'ethers'
import {
  useEffect,
  useState,
} from 'react'

import {
  createSignerContracts,
} from '../contracts/client'
import type {
  DepositRecord,
  SavingPlan,
} from '../contracts/models'
import {
  automaticallyRenewDeposit,
  earlyWithdrawDeposit,
  manuallyRenewDeposit,
  withdrawDepositAtMaturity,
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
import type {
  DepositActionAvailability,
} from '../lib/depositActions'
import {
  formatBasisPoints,
} from '../lib/basisPoints'
import {
  calculateEarlyWithdrawalPenalty,
} from '../lib/finance'
import type {
  TransactionState,
} from '../lib/transaction'
import {
  formatMusdcAmount,
} from '../lib/units'
import type {
  SafeBankDataContextValue,
} from '../providers/safebank-data-context'
import type {
  WalletContextValue,
} from '../providers/wallet-context'
import {
  ConfirmationDialog,
} from './ConfirmationDialog'

export type DepositLifecycleContracts = {
  savingCore: unknown
}

export type CreateDepositLifecycleContracts = (
  signer: JsonRpcSigner,
) => DepositLifecycleContracts

type LifecycleAction =
  | 'early'
  | 'maturity'
  | 'manual-renew'
  | 'auto-renew'
  | null

type DepositLifecycleActionsProps = {
  wallet: WalletContextValue
  safeBank: SafeBankDataContextValue
  deposit: DepositRecord
  availability:
    DepositActionAvailability
  enabledPlans: SavingPlan[]
  createWriteContracts?:
    CreateDepositLifecycleContracts
}

function createDefaultWriteContracts(
  signer: JsonRpcSigner,
): DepositLifecycleContracts {
  const contracts =
    createSignerContracts(signer)

  return {
    savingCore:
      contracts.savingCore,
  }
}

function getPreferredPlanId(
  deposit: DepositRecord,
  enabledPlans: SavingPlan[],
): string {
  const currentPlan =
    enabledPlans.find(
      (plan) =>
        plan.planId ===
        deposit.planId,
    )

  return (
    currentPlan ??
    enabledPlans[0]
  )?.planId.toString() ?? ''
}

function getTransactionStatusText(
  state: TransactionState,
  t: (key: TranslationKey) => string,
): string {
  switch (state.phase) {
    case 'idle':
      return ''
    case 'awaiting-signature':
      return t('lifecycleAwaitingSignature')
    case 'submitted':
      return t('lifecycleSubmitted')
    case 'confirming':
      return t('transactionConfirming')
    case 'confirmed':
      return t('lifecycleConfirmed')
    case 'failed':
      return (
        localizeTransactionError(
          state.error,
          t,
        ) ?? t('lifecycleFailed')
      )
  }
}

function getActionLabel(
  action: LifecycleAction,
  t: (key: TranslationKey) => string,
): string {
  switch (action) {
    case 'early':
      return t('actionEarlyWithdrawal')
    case 'maturity':
      return t('actionMaturityWithdrawal')
    case 'manual-renew':
      return t('actionManualRenewal')
    case 'auto-renew':
      return t('actionAutoRenewal')
    case null:
      return t('lifecycleAction')
  }
}

export function DepositLifecycleActions({
  wallet,
  safeBank,
  deposit,
  availability,
  enabledPlans,
  createWriteContracts =
    createDefaultWriteContracts,
}: DepositLifecycleActionsProps) {
  const transaction =
    useTransaction()
  const { t } = useLanguage()

  const [
    activeAction,
    setActiveAction,
  ] = useState<LifecycleAction>(
    null,
  )

  const [
    earlyWithdrawalConfirmationOpen,
    setEarlyWithdrawalConfirmationOpen,
  ] = useState(false)

  const [
    maturityWithdrawalConfirmationOpen,
    setMaturityWithdrawalConfirmationOpen,
  ] = useState(false)

  const [
    manualRenewalConfirmationOpen,
    setManualRenewalConfirmationOpen,
  ] = useState(false)

  const [
    autoRenewalConfirmationOpen,
    setAutoRenewalConfirmationOpen,
  ] = useState(false)

  const [
    selectedPlanId,
    setSelectedPlanId,
  ] = useState(() =>
    getPreferredPlanId(
      deposit,
      enabledPlans,
    ),
  )

  useEffect(() => {
    const selectedPlanExists =
      enabledPlans.some(
        (plan) =>
          plan.planId.toString() ===
          selectedPlanId,
      )

    if (!selectedPlanExists) {
      setSelectedPlanId(
        getPreferredPlanId(
          deposit,
          enabledPlans,
        ),
      )
    }
  }, [
    deposit,
    enabledPlans,
    selectedPlanId,
  ])

  const selectedPlan =
    enabledPlans.find(
      (plan) =>
        plan.planId.toString() ===
        selectedPlanId,
    ) ?? null

  const earlyWithdrawalPenalty =
    calculateEarlyWithdrawalPenalty(
      deposit.principal,
      deposit.penaltyBpsAtOpen,
    )

  const actionAvailable =
    availability.canEarlyWithdraw ||
    availability
      .canWithdrawAtMaturity ||
    availability.canManualRenew ||
    availability.canAutoRenew

  if (!actionAvailable) {
    return null
  }

  const walletReady =
    wallet.isConnected &&
    wallet.isSepolia

  const executeLifecycleAction =
    async (
      action: Exclude<
        LifecycleAction,
        null
      >,
    ) => {
      if (
        transaction.isPending ||
        !walletReady
      ) {
        return
      }

      if (
        action === 'manual-renew' &&
        selectedPlan === null
      ) {
        return
      }

      setActiveAction(action)

      const result =
        await transaction.execute(
          async () => {
            const signer =
              await wallet.getSigner()

            const contracts =
              createWriteContracts(
                signer,
              )

            switch (action) {
              case 'early':
                return earlyWithdrawDeposit(
                  contracts.savingCore,
                  deposit.depositId,
                )

              case 'maturity':
                return withdrawDepositAtMaturity(
                  contracts.savingCore,
                  deposit.depositId,
                )

              case 'manual-renew':
                if (
                  selectedPlan ===
                  null
                ) {
                  throw new Error(
                    t('selectRenewalPlan'),
                  )
                }

                return manuallyRenewDeposit(
                  contracts.savingCore,
                  deposit.depositId,
                  selectedPlan.planId,
                )

              case 'auto-renew':
                return automaticallyRenewDeposit(
                  contracts.savingCore,
                  deposit.depositId,
                )
            }
          },
        )

      if (result) {
        await safeBank.refresh()
      }
    }

  return (
    <div className="lifecycle-actions">
      {availability.canManualRenew && (
        <div className="renewal-fields">
          {enabledPlans.length > 0 ? (
            <>
              <label
                htmlFor={`renew-plan-${deposit.depositId.toString()}`}
              >
                {t('renewalPlan')}
              </label>

              <select
                id={`renew-plan-${deposit.depositId.toString()}`}
                value={selectedPlanId}
                disabled={
                  transaction.isPending ||
                  !walletReady
                }
                onChange={(event) => {
                  setSelectedPlanId(
                    event.target.value,
                  )
                  setManualRenewalConfirmationOpen(
                    false,
                  )
                  transaction.reset()
                }}
              >
                {enabledPlans.map(
                  (plan) => (
                    <option
                      key={
                        plan.planId.toString()
                      }
                      value={
                        plan.planId.toString()
                      }
                    >
                      {t('plan')} #
                      {plan.planId.toString()}
                      {' — '}
                      {plan.tenorDays.toString()}{' '}
                      {t('days')}
                    </option>
                  ),
                )}
              </select>
            </>
          ) : (
            <p className="form-guidance">
              {t('noRenewalPlan')}
            </p>
          )}
        </div>
      )}

      <div className="deposit-actions">
        {availability
          .canEarlyWithdraw && (
          <button
            className="secondary-button"
            type="button"
            disabled={
              transaction.isPending ||
              !walletReady
            }
            aria-label={`${t('earlyWithdrawDeposit')} ${deposit.depositId.toString()}`}
            onClick={() => {
              setEarlyWithdrawalConfirmationOpen(
                true,
              )
            }}
          >
            {transaction.isPending &&
            activeAction === 'early'
              ? t('withdrawingEarly')
              : t('withdrawEarly')}
          </button>
        )}

        {availability
          .canWithdrawAtMaturity && (
          <button
            className="primary-button"
            type="button"
            disabled={
              transaction.isPending ||
              !walletReady
            }
            aria-label={`${t('maturityWithdrawDeposit')} ${deposit.depositId.toString()}`}
            onClick={() => {
              setMaturityWithdrawalConfirmationOpen(
                true,
              )
            }}
          >
            {transaction.isPending &&
            activeAction === 'maturity'
              ? t('withdrawingAtMaturity')
              : t('withdrawAtMaturity')}
          </button>
        )}

        {availability.canManualRenew && (
          <button
            className="secondary-button"
            type="button"
            disabled={
              transaction.isPending ||
              !walletReady ||
              selectedPlan === null
            }
            aria-label={`${t('manualRenewDeposit')} ${deposit.depositId.toString()}`}
            onClick={() => {
              setManualRenewalConfirmationOpen(
                true,
              )
            }}
          >
            {transaction.isPending &&
            activeAction ===
              'manual-renew'
              ? t('renewingDeposit')
              : t('renewManually')}
          </button>
        )}

        {availability.canAutoRenew && (
          <button
            className="secondary-button"
            type="button"
            disabled={
              transaction.isPending ||
              !walletReady
            }
            aria-label={`${t('automaticRenewDeposit')} ${deposit.depositId.toString()}`}
            onClick={() => {
              setAutoRenewalConfirmationOpen(
                true,
              )
            }}
          >
            {transaction.isPending &&
            activeAction ===
              'auto-renew'
              ? t('autoRenewingDeposit')
              : t('autoRenew')}
          </button>
        )}
      </div>

      {wallet.isConnected &&
        !wallet.isSepolia && (
          <p className="form-guidance">
            {t('switchBeforeTransaction')}
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
            {getActionLabel(
              activeAction,
              t,
            )}
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
      <ConfirmationDialog
        open={autoRenewalConfirmationOpen}
        title={t(
          'autoRenewalConfirmationTitle',
        )}
        description={t(
          'autoRenewalConfirmationDescription',
        )}
        confirmLabel={t(
          'confirmationContinueToWallet',
        )}
        cancelLabel={t(
          'confirmationCancel',
        )}
        onCancel={() => {
          setAutoRenewalConfirmationOpen(false)
        }}
        onConfirm={() => {
          setAutoRenewalConfirmationOpen(false)
          void executeLifecycleAction(
            'auto-renew',
          )
        }}
      >
        <dl>
          <div>
            <dt>{t('confirmationDepositId')}</dt>
            <dd>#{deposit.depositId.toString()}</dd>
          </div>

          <div>
            <dt>{t('confirmationPrincipal')}</dt>
            <dd>
              {formatMusdcAmount(
                deposit.principal,
              )}{' '}
              mUSDC
            </dd>
          </div>

          <div>
            <dt>{t('confirmationPlanId')}</dt>
            <dd>#{deposit.planId.toString()}</dd>
          </div>

          <div>
            <dt>{t('aprAtOpening')}</dt>
            <dd>
              {formatBasisPoints(
                deposit.aprBpsAtOpen,
              )}
            </dd>
          </div>
        </dl>
      </ConfirmationDialog>

      {selectedPlan !== null ? (
        <ConfirmationDialog
          open={manualRenewalConfirmationOpen}
          title={t(
            'manualRenewalConfirmationTitle',
          )}
          description={t(
            'manualRenewalConfirmationDescription',
          )}
          confirmLabel={t(
            'confirmationContinueToWallet',
          )}
          cancelLabel={t(
            'confirmationCancel',
          )}
          onCancel={() => {
            setManualRenewalConfirmationOpen(
              false,
            )
          }}
          onConfirm={() => {
            setManualRenewalConfirmationOpen(
              false,
            )
            void executeLifecycleAction(
              'manual-renew',
            )
          }}
        >
          <dl>
            <div>
              <dt>{t('confirmationDepositId')}</dt>
              <dd>#{deposit.depositId.toString()}</dd>
            </div>

            <div>
              <dt>{t('confirmationPrincipal')}</dt>
              <dd>
                {formatMusdcAmount(
                  deposit.principal,
                )}{' '}
                mUSDC
              </dd>
            </div>

            <div>
              <dt>{t('confirmationRenewalPlan')}</dt>
              <dd>#{selectedPlan.planId.toString()}</dd>
            </div>

            <div>
              <dt>{t('confirmationTenor')}</dt>
              <dd>
                {selectedPlan.tenorDays.toString()}{' '}
                {t('days')}
              </dd>
            </div>

            <div>
              <dt>{t('confirmationNewApr')}</dt>
              <dd>
                {formatBasisPoints(
                  selectedPlan.aprBps,
                )}
              </dd>
            </div>

            <div>
              <dt>
                {t('confirmationEarlyPenalty')}
              </dt>
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

      <ConfirmationDialog
        open={maturityWithdrawalConfirmationOpen}
        title={t(
          'maturityWithdrawalConfirmationTitle',
        )}
        description={t(
          'maturityWithdrawalConfirmationDescription',
        )}
        confirmLabel={t(
          'confirmationContinueToWallet',
        )}
        cancelLabel={t(
          'confirmationCancel',
        )}
        onCancel={() => {
          setMaturityWithdrawalConfirmationOpen(
            false,
          )
        }}
        onConfirm={() => {
          setMaturityWithdrawalConfirmationOpen(
            false,
          )
          void executeLifecycleAction('maturity')
        }}
      >
        <dl>
          <div>
            <dt>{t('confirmationDepositId')}</dt>
            <dd>#{deposit.depositId.toString()}</dd>
          </div>

          <div>
            <dt>{t('confirmationPrincipal')}</dt>
            <dd>
              {formatMusdcAmount(
                deposit.principal,
              )}{' '}
              mUSDC
            </dd>
          </div>

          <div>
            <dt>{t('aprAtOpening')}</dt>
            <dd>
              {formatBasisPoints(
                deposit.aprBpsAtOpen,
              )}
            </dd>
          </div>
        </dl>
      </ConfirmationDialog>

      <ConfirmationDialog
        open={earlyWithdrawalConfirmationOpen}
        title={t(
          'earlyWithdrawalConfirmationTitle',
        )}
        description={t(
          'earlyWithdrawalConfirmationDescription',
        )}
        confirmLabel={t(
          'confirmationContinueToWallet',
        )}
        cancelLabel={t(
          'confirmationCancel',
        )}
        tone="danger"
        onCancel={() => {
          setEarlyWithdrawalConfirmationOpen(
            false,
          )
        }}
        onConfirm={() => {
          setEarlyWithdrawalConfirmationOpen(
            false,
          )
          void executeLifecycleAction('early')
        }}
      >
        <dl>
          <div>
            <dt>{t('confirmationDepositId')}</dt>
            <dd>#{deposit.depositId.toString()}</dd>
          </div>

          <div>
            <dt>{t('confirmationPrincipal')}</dt>
            <dd>
              {formatMusdcAmount(
                deposit.principal,
              )}{' '}
              mUSDC
            </dd>
          </div>

          <div>
            <dt>{t('confirmationEarlyPenalty')}</dt>
            <dd>
              {formatBasisPoints(
                deposit.penaltyBpsAtOpen,
              )}{' '}
              ({formatMusdcAmount(
                earlyWithdrawalPenalty,
              )}{' '}
              mUSDC)
            </dd>
          </div>

          <div>
            <dt>
              {t('confirmationNetPrincipal')}
            </dt>
            <dd>
              {formatMusdcAmount(
                deposit.principal -
                  earlyWithdrawalPenalty,
              )}{' '}
              mUSDC
            </dd>
          </div>
        </dl>
      </ConfirmationDialog>
    </div>
  )
}
