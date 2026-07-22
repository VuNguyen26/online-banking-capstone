import {
  SAFE_BANK_DEPLOYMENT,
} from './generated/contracts'
import {
  readAdminConfiguration,
  readAdminDepositCount,
  readAdminTokenAccountState,
  type AdminConfiguration,
  type AdminTokenAccountState,
} from './adminRead'
import {
  readSavingPlans,
  readVaultMetrics,
} from './read'
import type {
  SavingPlan,
  VaultMetrics,
} from './models'
import {
  deriveAdminAuthorization,
  type AdminAuthorization,
} from '../lib/adminAuthorization'

export type AdminDashboardContracts = {
  mockUsdc: unknown
  vaultManager: unknown
  savingCore: unknown
}

export type AdminDashboardData = {
  configuration: AdminConfiguration
  authorization: AdminAuthorization
  plans: SavingPlan[]
  depositCount: bigint
  vaultMetrics: VaultMetrics
  tokenAccountState:
    AdminTokenAccountState | null
}

export type LoadAdminDashboardArguments = {
  contracts: AdminDashboardContracts
  account: string | null
}

export async function loadAdminDashboard({
  contracts,
  account,
}: LoadAdminDashboardArguments): Promise<AdminDashboardData> {
  const tokenAccountStatePromise =
    account === null
      ? Promise.resolve(null)
      : readAdminTokenAccountState(
          contracts.mockUsdc,
          account,
          SAFE_BANK_DEPLOYMENT.contracts
            .VaultManager.address,
        )

  const [
    configuration,
    plans,
    depositCount,
    vaultMetrics,
    tokenAccountState,
  ] = await Promise.all([
    readAdminConfiguration(
      contracts.savingCore,
      contracts.vaultManager,
    ),
    readSavingPlans(
      contracts.savingCore,
    ),
    readAdminDepositCount(
      contracts.savingCore,
    ),
    readVaultMetrics(
      contracts.vaultManager,
    ),
    tokenAccountStatePromise,
  ])

  return {
    configuration,
    authorization:
      deriveAdminAuthorization({
        account,
        savingCoreOwner:
          configuration.savingCoreOwner,
        savingCorePendingOwner:
          configuration.savingCorePendingOwner,
        vaultManagerOwner:
          configuration.vaultManagerOwner,
        vaultManagerPendingOwner:
          configuration.vaultManagerPendingOwner,
      }),
    plans,
    depositCount,
    vaultMetrics,
    tokenAccountState,
  }
}