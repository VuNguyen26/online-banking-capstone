import {
  ZeroAddress,
} from 'ethers'

import type {
  AdminDashboardData,
} from '../contracts/adminDashboard'
import type {
  SafeBankDashboardData,
} from '../contracts/dashboard'
import type {
  DepositRecord,
  SavingPlan,
  VaultMetrics,
} from '../contracts/models'
import {
  deriveAdminConfigurationHealth,
} from '../lib/adminConfigurationHealth'
import {
  formatBasisPoints,
} from '../lib/basisPoints'
import {
  formatUnixTimestampUtc,
} from '../lib/dateTime'
import {
  getDepositActionAvailability,
} from '../lib/depositActions'
import {
  DEPOSIT_STATUS,
} from '../lib/deposits'
import {
  calculateEarlyWithdrawalPenalty,
  calculateSimpleInterest,
} from '../lib/finance'
import {
  SECONDS_PER_DAY,
} from '../lib/time'
import {
  formatMusdcAmount,
} from '../lib/units'

export type AssistantPlanContext = {
  planId: string
  tenorDays: string
  apr: string
  minimumDeposit: string
  maximumDeposit: string
  earlyWithdrawalPenalty: string
  enabled: boolean
}

export type AssistantDepositStatus =
  | 'active'
  | 'withdrawn'
  | 'manually-renewed'
  | 'automatically-renewed'

export type AssistantDepositContext = {
  depositId: string
  planId: string
  principal: string
  tenorDays: string
  aprAtOpen: string
  earlyWithdrawalPenaltyRate: string
  estimatedInterest: string
  estimatedEarlyWithdrawalPenalty: string
  estimatedNetPrincipalAfterPenalty: string
  status: AssistantDepositStatus
  startedAtUtc: string
  maturityAtUtc: string
  graceEndsAtUtc: string
  availableActions: {
    canEarlyWithdraw: boolean
    canWithdrawAtMaturity: boolean
    canManualRenew: boolean
    canAutoRenew: boolean
  }
}

export type AssistantVaultContext = {
  vaultBalance: string
  totalReservedInterest: string
  availableLiquidity: string
  fundingShortfall: string
  isUnderfunded: boolean
}

export type BankingAssistantContext = {
  network: 'Ethereum Sepolia'
  testToken: 'mUSDC'
  account: string | null
  protocol: {
    planCount: string
    depositCount: string
    savingCorePaused: boolean
    vaultManagerPaused: boolean
    gracePeriodDays: string
    latestBlockTimestampUtc: string
  }
  plans: AssistantPlanContext[]
  deposits: AssistantDepositContext[]
  pendingInterestClaims: Array<{
    depositId: string
    amount: string
    claimant: string
  }>
  vault: AssistantVaultContext
  tokenAccount: {
    balance: string
    savingCoreAllowance: string
  } | null
}

export type RiskAssistantContext = {
  network: 'Ethereum Sepolia'
  testToken: 'mUSDC'
  depositCount: string
  configuration: {
    savingCoreOwner: string
    savingCorePendingOwner: string | null
    vaultManagerOwner: string
    vaultManagerPendingOwner: string | null
    feeReceiver: string
    savingCorePaused: boolean
    vaultManagerPaused: boolean
  }
  authorization: {
    isSavingCoreOwner: boolean
    isVaultManagerOwner: boolean
    isSavingCorePendingOwner: boolean
    isVaultManagerPendingOwner: boolean
  }
  relationships: {
    savingCoreTokenMatches: boolean
    savingCoreVaultManagerMatches: boolean
    vaultManagerTokenMatches: boolean
    vaultManagerSavingCoreMatches: boolean
    allRelationshipsValid: boolean
  }
  plans: AssistantPlanContext[]
  vault: AssistantVaultContext
  connectedWalletFundingSource: {
    balance: string
    vaultManagerAllowance: string
  } | null
}

function formatAmount(
  value: bigint,
): string {
  return `${formatMusdcAmount(value)} mUSDC`
}

function buildPlanContext(
  plan: SavingPlan,
): AssistantPlanContext {
  return {
    planId: plan.planId.toString(),
    tenorDays: plan.tenorDays.toString(),
    apr: formatBasisPoints(
      plan.aprBps,
    ),
    minimumDeposit: formatAmount(
      plan.minDeposit,
    ),
    maximumDeposit: formatAmount(
      plan.maxDeposit,
    ),
    earlyWithdrawalPenalty:
      formatBasisPoints(
        plan.earlyWithdrawPenaltyBps,
      ),
    enabled: plan.enabled,
  }
}

function getDepositStatus(
  status: bigint,
): AssistantDepositStatus {
  switch (status) {
    case DEPOSIT_STATUS.Active:
      return 'active'
    case DEPOSIT_STATUS.Withdrawn:
      return 'withdrawn'
    case DEPOSIT_STATUS.ManualRenewed:
      return 'manually-renewed'
    case DEPOSIT_STATUS.AutoRenewed:
      return 'automatically-renewed'
    default:
      throw new Error(
        `Unknown deposit status: ${status}`,
      )
  }
}

function buildDepositContext(
  deposit: DepositRecord,
  currentBlockTimestamp: bigint,
  gracePeriodSeconds: bigint,
  savingCorePaused: boolean,
): AssistantDepositContext {
  const availability =
    getDepositActionAvailability(
      deposit,
      currentBlockTimestamp,
      gracePeriodSeconds,
      savingCorePaused,
    )

  const estimatedInterest =
    calculateSimpleInterest(
      deposit.principal,
      deposit.aprBpsAtOpen,
      deposit.tenorDays,
    )

  const estimatedPenalty =
    calculateEarlyWithdrawalPenalty(
      deposit.principal,
      deposit.penaltyBpsAtOpen,
    )

  return {
    depositId:
      deposit.depositId.toString(),
    planId: deposit.planId.toString(),
    principal: formatAmount(
      deposit.principal,
    ),
    tenorDays:
      deposit.tenorDays.toString(),
    aprAtOpen: formatBasisPoints(
      deposit.aprBpsAtOpen,
    ),
    earlyWithdrawalPenaltyRate:
      formatBasisPoints(
        deposit.penaltyBpsAtOpen,
      ),
    estimatedInterest: formatAmount(
      estimatedInterest,
    ),
    estimatedEarlyWithdrawalPenalty:
      formatAmount(estimatedPenalty),
    estimatedNetPrincipalAfterPenalty:
      formatAmount(
        deposit.principal -
          estimatedPenalty,
      ),
    status: getDepositStatus(
      deposit.status,
    ),
    startedAtUtc:
      formatUnixTimestampUtc(
        deposit.startedAt,
      ),
    maturityAtUtc:
      formatUnixTimestampUtc(
        deposit.maturityAt,
      ),
    graceEndsAtUtc:
      formatUnixTimestampUtc(
        availability.timing
          .graceEndsAt,
      ),
    availableActions: {
      canEarlyWithdraw:
        availability.canEarlyWithdraw,
      canWithdrawAtMaturity:
        availability
          .canWithdrawAtMaturity,
      canManualRenew:
        availability.canManualRenew,
      canAutoRenew:
        availability.canAutoRenew,
    },
  }
}

function buildVaultContext(
  metrics: VaultMetrics,
): AssistantVaultContext {
  return {
    vaultBalance: formatAmount(
      metrics.vaultBalance,
    ),
    totalReservedInterest:
      formatAmount(
        metrics.totalReservedInterest,
      ),
    availableLiquidity:
      formatAmount(
        metrics.availableLiquidity,
      ),
    fundingShortfall: formatAmount(
      metrics.fundingShortfall,
    ),
    isUnderfunded:
      metrics.fundingShortfall > 0n,
  }
}

function optionalAddress(
  address: string,
): string | null {
  return address === ZeroAddress
    ? null
    : address
}

export function buildBankingAssistantContext(
  data: SafeBankDashboardData,
  account: string | null,
): BankingAssistantContext {
  const {
    protocolStatus,
  } = data

  return {
    network: 'Ethereum Sepolia',
    testToken: 'mUSDC',
    account,
    protocol: {
      planCount:
        protocolStatus.planCount.toString(),
      depositCount:
        protocolStatus.depositCount.toString(),
      savingCorePaused:
        protocolStatus.savingCorePaused,
      vaultManagerPaused:
        protocolStatus.vaultManagerPaused,
      gracePeriodDays: (
        protocolStatus.gracePeriodSeconds /
        SECONDS_PER_DAY
      ).toString(),
      latestBlockTimestampUtc:
        formatUnixTimestampUtc(
          protocolStatus
            .latestBlockTimestamp,
        ),
    },
    plans: data.plans.map(
      buildPlanContext,
    ),
    deposits: data.ownedDeposits.map(
      (deposit) =>
        buildDepositContext(
          deposit,
          protocolStatus
            .latestBlockTimestamp,
          protocolStatus
            .gracePeriodSeconds,
          protocolStatus
            .savingCorePaused,
        ),
    ),
    pendingInterestClaims:
      data.pendingInterestClaims.map(
        (claim) => ({
          depositId:
            claim.depositId.toString(),
          amount: formatAmount(
            claim.amount,
          ),
          claimant: claim.claimant,
        }),
      ),
    vault: buildVaultContext(
      data.vaultMetrics,
    ),
    tokenAccount:
      data.tokenAccountState === null
        ? null
        : {
            balance: formatAmount(
              data.tokenAccountState
                .balance,
            ),
            savingCoreAllowance:
              formatAmount(
                data.tokenAccountState
                  .allowance,
              ),
          },
  }
}

export function buildRiskAssistantContext(
  data: AdminDashboardData,
): RiskAssistantContext {
  const health =
    deriveAdminConfigurationHealth(
      data.configuration,
    )

  return {
    network: 'Ethereum Sepolia',
    testToken: 'mUSDC',
    depositCount:
      data.depositCount.toString(),
    configuration: {
      savingCoreOwner:
        data.configuration
          .savingCoreOwner,
      savingCorePendingOwner:
        optionalAddress(
          data.configuration
            .savingCorePendingOwner,
        ),
      vaultManagerOwner:
        data.configuration
          .vaultManagerOwner,
      vaultManagerPendingOwner:
        optionalAddress(
          data.configuration
            .vaultManagerPendingOwner,
        ),
      feeReceiver:
        data.configuration.feeReceiver,
      savingCorePaused:
        data.configuration
          .savingCorePaused,
      vaultManagerPaused:
        data.configuration
          .vaultManagerPaused,
    },
    authorization: {
      ...data.authorization,
    },
    relationships: health,
    plans: data.plans.map(
      buildPlanContext,
    ),
    vault: buildVaultContext(
      data.vaultMetrics,
    ),
    connectedWalletFundingSource:
      data.tokenAccountState === null
        ? null
        : {
            balance: formatAmount(
              data.tokenAccountState
                .balance,
            ),
            vaultManagerAllowance:
              formatAmount(
                data.tokenAccountState
                  .vaultManagerAllowance,
              ),
          },
  }
}