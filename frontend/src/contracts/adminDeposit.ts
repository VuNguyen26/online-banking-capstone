import type {
  DepositRecord,
} from './models'
import {
  decodeDepositRecord,
} from './decode'

type SavingCoreDepositReadContract = {
  getDeposit: (
    depositId: bigint,
  ) => Promise<unknown>
}

export async function readAdminDeposit(
  savingCore: unknown,
  depositId: bigint,
): Promise<DepositRecord> {
  if (
    typeof depositId !== 'bigint' ||
    depositId <= 0n
  ) {
    throw new Error(
      'depositId must be a positive bigint.',
    )
  }

  const contract =
    savingCore as SavingCoreDepositReadContract

  const value =
    await contract.getDeposit(depositId)

  return decodeDepositRecord(
    depositId,
    value,
  )
}