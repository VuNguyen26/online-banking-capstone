import {
  SAFE_BANK_DEPLOYMENT,
} from './generated/contracts'
import type {
  SubmittedTransactionLike,
} from '../hooks/useTransaction'

type MockUsdcWriteContract = {
  mint: (
    to: string,
    amount: bigint,
  ) => Promise<SubmittedTransactionLike>

  approve: (
    spender: string,
    amount: bigint,
  ) => Promise<SubmittedTransactionLike>
}

type SavingCoreWriteContract = {
  openDeposit: (
    planId: bigint,
    amount: bigint,
  ) => Promise<SubmittedTransactionLike>

  earlyWithdraw: (
    depositId: bigint,
  ) => Promise<SubmittedTransactionLike>

  withdrawAtMaturity: (
    depositId: bigint,
  ) => Promise<SubmittedTransactionLike>

  manualRenew: (
    depositId: bigint,
    newPlanId: bigint,
  ) => Promise<SubmittedTransactionLike>

  autoRenew: (
    depositId: bigint,
  ) => Promise<SubmittedTransactionLike>

  claimPendingInterest: (
    depositId: bigint,
  ) => Promise<SubmittedTransactionLike>
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

export async function mintMockUsdc(
  mockUsdc: unknown,
  recipient: string,
  amount: bigint,
): Promise<SubmittedTransactionLike> {
  requirePositiveBigInt(amount, 'mintAmount')

  const contract =
    mockUsdc as MockUsdcWriteContract

  return contract.mint(recipient, amount)
}

export async function approveSavingCore(
  mockUsdc: unknown,
  amount: bigint,
): Promise<SubmittedTransactionLike> {
  requirePositiveBigInt(
    amount,
    'approvalAmount',
  )

  const contract =
    mockUsdc as MockUsdcWriteContract

  return contract.approve(
    SAFE_BANK_DEPLOYMENT.contracts.SavingCore.address,
    amount,
  )
}

export async function openSavingDeposit(
  savingCore: unknown,
  planId: bigint,
  amount: bigint,
): Promise<SubmittedTransactionLike> {
  requirePositiveBigInt(planId, 'planId')
  requirePositiveBigInt(amount, 'depositAmount')

  const contract =
    savingCore as SavingCoreWriteContract

  return contract.openDeposit(
    planId,
    amount,
  )
}

export async function earlyWithdrawDeposit(
  savingCore: unknown,
  depositId: bigint,
): Promise<SubmittedTransactionLike> {
  requirePositiveBigInt(
    depositId,
    'depositId',
  )

  const contract =
    savingCore as SavingCoreWriteContract

  return contract.earlyWithdraw(depositId)
}

export async function withdrawDepositAtMaturity(
  savingCore: unknown,
  depositId: bigint,
): Promise<SubmittedTransactionLike> {
  requirePositiveBigInt(
    depositId,
    'depositId',
  )

  const contract =
    savingCore as SavingCoreWriteContract

  return contract.withdrawAtMaturity(
    depositId,
  )
}

export async function manuallyRenewDeposit(
  savingCore: unknown,
  depositId: bigint,
  newPlanId: bigint,
): Promise<SubmittedTransactionLike> {
  requirePositiveBigInt(
    depositId,
    'depositId',
  )

  requirePositiveBigInt(
    newPlanId,
    'newPlanId',
  )

  const contract =
    savingCore as SavingCoreWriteContract

  return contract.manualRenew(
    depositId,
    newPlanId,
  )
}

export async function automaticallyRenewDeposit(
  savingCore: unknown,
  depositId: bigint,
): Promise<SubmittedTransactionLike> {
  requirePositiveBigInt(
    depositId,
    'depositId',
  )

  const contract =
    savingCore as SavingCoreWriteContract

  return contract.autoRenew(depositId)
}

export async function claimDepositPendingInterest(
  savingCore: unknown,
  depositId: bigint,
): Promise<SubmittedTransactionLike> {
  requirePositiveBigInt(
    depositId,
    'depositId',
  )

  const contract =
    savingCore as SavingCoreWriteContract

  return contract.claimPendingInterest(
    depositId,
  )
}
