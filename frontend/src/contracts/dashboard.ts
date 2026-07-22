import type {
  DepositRecord,
  PendingInterestState,
  SavingPlan,
  TokenAccountState,
  VaultMetrics,
} from './models'
import {
  readProtocolStatus,
  readSavingPlans,
  readTokenAccountState,
  readVaultMetrics,
  type ProtocolStatus,
} from './read'
import {
  SAFE_BANK_DEPLOYMENT,
} from './generated/contracts'
import {
  readWalletOwnedDeposits,
  type OwnedDepositsReader,
} from './walletDeposits'
import {
  readWalletPendingInterestClaims,
  type PendingInterestClaimsReader,
} from './pendingInterest'

export type DashboardContracts = {
  mockUsdc: unknown
  vaultManager: unknown
  savingCore: unknown
}

export type SafeBankDashboardData = {
  plans: SavingPlan[]
  ownedDeposits: DepositRecord[]
  pendingInterestClaims:
    PendingInterestState[]
  protocolStatus: ProtocolStatus
  vaultMetrics: VaultMetrics
  tokenAccountState: TokenAccountState | null
}

export type LoadSafeBankDashboardArguments = {
  provider: unknown
  contracts: DashboardContracts
  account: string | null
  ownedDepositsReader?:
    OwnedDepositsReader
  pendingInterestClaimsReader?:
    PendingInterestClaimsReader
}

export async function loadSafeBankDashboard({
  provider,
  contracts,
  account,
  ownedDepositsReader,
  pendingInterestClaimsReader,
}: LoadSafeBankDashboardArguments): Promise<SafeBankDashboardData> {
  const tokenAccountStatePromise =
    account === null
      ? Promise.resolve(null)
      : readTokenAccountState(
          contracts.mockUsdc,
          account,
          SAFE_BANK_DEPLOYMENT.contracts
            .SavingCore.address,
        )

  const ownedDepositsPromise =
    readWalletOwnedDeposits(
      provider,
      contracts.savingCore,
      account,
      ownedDepositsReader,
    )

  const pendingInterestClaimsPromise =
    readWalletPendingInterestClaims(
      provider,
      contracts.savingCore,
      account,
      pendingInterestClaimsReader,
    )

  const [
    plans,
    ownedDeposits,
    pendingInterestClaims,
    protocolStatus,
    vaultMetrics,
    tokenAccountState,
  ] = await Promise.all([
    readSavingPlans(
      contracts.savingCore,
    ),
    ownedDepositsPromise,
    pendingInterestClaimsPromise,
    readProtocolStatus(
      contracts.savingCore,
      contracts.vaultManager,
      provider,
    ),
    readVaultMetrics(
      contracts.vaultManager,
    ),
    tokenAccountStatePromise,
  ])

  return {
    plans,
    ownedDeposits,
    pendingInterestClaims,
    protocolStatus,
    vaultMetrics,
    tokenAccountState,
  }
}
