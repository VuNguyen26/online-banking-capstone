import {
  getAddress,
} from 'ethers'

import type {
  DepositRecord,
  PendingInterestState,
} from '../contracts/models'
import {
  DEPOSIT_STATUS,
} from './deposits'
import {
  getDepositTiming,
  type DepositTiming,
} from './time'

export type DepositActionAvailability = {
  timing: DepositTiming
  isActive: boolean
  canEarlyWithdraw: boolean
  canWithdrawAtMaturity: boolean
  canManualRenew: boolean
  canAutoRenew: boolean
}

export function getDepositActionAvailability(
  deposit: DepositRecord,
  currentBlockTimestamp: bigint,
  gracePeriodSeconds: bigint,
  savingCorePaused: boolean,
): DepositActionAvailability {
  const timing =
    getDepositTiming(
      deposit.maturityAt,
      currentBlockTimestamp,
      gracePeriodSeconds,
    )

  const isActive =
    deposit.status ===
    DEPOSIT_STATUS.Active

  const actionsEnabled =
    isActive &&
    !savingCorePaused

  return {
    timing,
    isActive,
    canEarlyWithdraw:
      actionsEnabled &&
      timing.canEarlyWithdraw,
    canWithdrawAtMaturity:
      actionsEnabled &&
      timing.canWithdrawAtMaturity,
    canManualRenew:
      actionsEnabled &&
      timing.canManualRenew,
    canAutoRenew:
      actionsEnabled &&
      timing.canAutoRenew,
  }
}

export function canClaimPendingInterest(
  claim: PendingInterestState,
  connectedAccount: string,
  savingCorePaused: boolean,
): boolean {
  if (
    savingCorePaused ||
    claim.amount <= 0n
  ) {
    return false
  }

  return (
    getAddress(claim.claimant) ===
    getAddress(connectedAccount)
  )
}
