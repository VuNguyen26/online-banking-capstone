import type {
  DepositRecord,
} from './models'
import {
  readOwnedDeposits,
} from './ownedDeposits'

export type OwnedDepositsReader =
  typeof readOwnedDeposits

export async function readWalletOwnedDeposits(
  provider: unknown,
  savingCore: unknown,
  account: string | null,
  reader: OwnedDepositsReader =
    readOwnedDeposits,
): Promise<DepositRecord[]> {
  if (account === null) {
    return []
  }

  return reader(
    provider,
    savingCore,
    account,
  )
}
