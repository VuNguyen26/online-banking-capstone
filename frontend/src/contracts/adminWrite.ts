import {
  ZeroAddress,
  getAddress,
} from 'ethers'

import type {
  SubmittedTransactionLike,
} from '../hooks/useTransaction'
import {
  SAFE_BANK_DEPLOYMENT,
} from './generated/contracts'

type MockUsdcAdminWriteContract = {
  approve: (
    spender: string,
    amount: bigint,
  ) => Promise<SubmittedTransactionLike>
}

type SavingCoreAdminWriteContract = {
  createPlan: (
    tenorDays: bigint,
    aprBps: bigint,
    minDeposit: bigint,
    maxDeposit: bigint,
    earlyWithdrawPenaltyBps: bigint,
    enabled: boolean,
  ) => Promise<SubmittedTransactionLike>

  updatePlan: (
    planId: bigint,
    newAprBps: bigint,
  ) => Promise<SubmittedTransactionLike>

  enablePlan: (
    planId: bigint,
  ) => Promise<SubmittedTransactionLike>

  disablePlan: (
    planId: bigint,
  ) => Promise<SubmittedTransactionLike>

  pause: () =>
    Promise<SubmittedTransactionLike>

  unpause: () =>
    Promise<SubmittedTransactionLike>
}

type VaultManagerAdminWriteContract = {
  fundVault: (
    amount: bigint,
  ) => Promise<SubmittedTransactionLike>

  withdrawVault: (
    amount: bigint,
  ) => Promise<SubmittedTransactionLike>

  setFeeReceiver: (
    feeReceiver: string,
  ) => Promise<SubmittedTransactionLike>

  pause: () =>
    Promise<SubmittedTransactionLike>

  unpause: () =>
    Promise<SubmittedTransactionLike>
}

export type CreateSavingPlanInput = {
  tenorDays: bigint
  aprBps: bigint
  minDeposit: bigint
  maxDeposit: bigint
  earlyWithdrawPenaltyBps: bigint
  enabled: boolean
}

function requirePositiveBigInt(
  value: bigint,
  fieldName: string,
): void {
  if (
    typeof value !== 'bigint' ||
    value <= 0n
  ) {
    throw new Error(
      `${fieldName} must be a positive bigint.`,
    )
  }
}

function requireUnsignedBigInt(
  value: bigint,
  fieldName: string,
): void {
  if (
    typeof value !== 'bigint' ||
    value < 0n
  ) {
    throw new Error(
      `${fieldName} must be an unsigned bigint.`,
    )
  }
}

function requireBoolean(
  value: boolean,
  fieldName: string,
): void {
  if (typeof value !== 'boolean') {
    throw new Error(
      `${fieldName} must be a boolean.`,
    )
  }
}

function requireNonZeroAddress(
  value: string,
  fieldName: string,
): string {
  let address: string

  try {
    address = getAddress(value)
  } catch {
    throw new Error(
      `${fieldName} must be a valid address.`,
    )
  }

  if (address === ZeroAddress) {
    throw new Error(
      `${fieldName} must not be the zero address.`,
    )
  }

  return address
}

export async function approveVaultManagerFunding(
  mockUsdc: unknown,
  amount: bigint,
): Promise<SubmittedTransactionLike> {
  requirePositiveBigInt(
    amount,
    'approvalAmount',
  )

  const contract =
    mockUsdc as MockUsdcAdminWriteContract

  return contract.approve(
    SAFE_BANK_DEPLOYMENT.contracts
      .VaultManager.address,
    amount,
  )
}

export async function createSavingPlan(
  savingCore: unknown,
  input: CreateSavingPlanInput,
): Promise<SubmittedTransactionLike> {
  requirePositiveBigInt(
    input.tenorDays,
    'tenorDays',
  )

  requirePositiveBigInt(
    input.aprBps,
    'aprBps',
  )

  requirePositiveBigInt(
    input.minDeposit,
    'minDeposit',
  )

  requirePositiveBigInt(
    input.maxDeposit,
    'maxDeposit',
  )

  requireUnsignedBigInt(
    input.earlyWithdrawPenaltyBps,
    'earlyWithdrawPenaltyBps',
  )

  requireBoolean(
    input.enabled,
    'enabled',
  )

  if (
    input.maxDeposit <
    input.minDeposit
  ) {
    throw new Error(
      'maxDeposit must be greater than or equal to minDeposit.',
    )
  }

  const contract =
    savingCore as SavingCoreAdminWriteContract

  return contract.createPlan(
    input.tenorDays,
    input.aprBps,
    input.minDeposit,
    input.maxDeposit,
    input.earlyWithdrawPenaltyBps,
    input.enabled,
  )
}

export async function updateSavingPlanApr(
  savingCore: unknown,
  planId: bigint,
  newAprBps: bigint,
): Promise<SubmittedTransactionLike> {
  requirePositiveBigInt(
    planId,
    'planId',
  )

  requirePositiveBigInt(
    newAprBps,
    'newAprBps',
  )

  const contract =
    savingCore as SavingCoreAdminWriteContract

  return contract.updatePlan(
    planId,
    newAprBps,
  )
}

export async function enableSavingPlan(
  savingCore: unknown,
  planId: bigint,
): Promise<SubmittedTransactionLike> {
  requirePositiveBigInt(
    planId,
    'planId',
  )

  const contract =
    savingCore as SavingCoreAdminWriteContract

  return contract.enablePlan(planId)
}

export async function disableSavingPlan(
  savingCore: unknown,
  planId: bigint,
): Promise<SubmittedTransactionLike> {
  requirePositiveBigInt(
    planId,
    'planId',
  )

  const contract =
    savingCore as SavingCoreAdminWriteContract

  return contract.disablePlan(planId)
}

export async function fundInterestVault(
  vaultManager: unknown,
  amount: bigint,
): Promise<SubmittedTransactionLike> {
  requirePositiveBigInt(
    amount,
    'fundingAmount',
  )

  const contract =
    vaultManager as VaultManagerAdminWriteContract

  return contract.fundVault(amount)
}

export async function withdrawInterestVault(
  vaultManager: unknown,
  amount: bigint,
): Promise<SubmittedTransactionLike> {
  requirePositiveBigInt(
    amount,
    'withdrawalAmount',
  )

  const contract =
    vaultManager as VaultManagerAdminWriteContract

  return contract.withdrawVault(amount)
}

export async function updateVaultFeeReceiver(
  vaultManager: unknown,
  feeReceiver: string,
): Promise<SubmittedTransactionLike> {
  const normalizedFeeReceiver =
    requireNonZeroAddress(
      feeReceiver,
      'feeReceiver',
    )

  const contract =
    vaultManager as VaultManagerAdminWriteContract

  return contract.setFeeReceiver(
    normalizedFeeReceiver,
  )
}

export async function pauseSavingCore(
  savingCore: unknown,
): Promise<SubmittedTransactionLike> {
  const contract =
    savingCore as SavingCoreAdminWriteContract

  return contract.pause()
}

export async function unpauseSavingCore(
  savingCore: unknown,
): Promise<SubmittedTransactionLike> {
  const contract =
    savingCore as SavingCoreAdminWriteContract

  return contract.unpause()
}

export async function pauseVaultManager(
  vaultManager: unknown,
): Promise<SubmittedTransactionLike> {
  const contract =
    vaultManager as VaultManagerAdminWriteContract

  return contract.pause()
}

export async function unpauseVaultManager(
  vaultManager: unknown,
): Promise<SubmittedTransactionLike> {
  const contract =
    vaultManager as VaultManagerAdminWriteContract

  return contract.unpause()
}