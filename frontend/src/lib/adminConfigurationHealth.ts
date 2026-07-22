import {
  getAddress,
} from 'ethers'

import type {
  AdminConfiguration,
} from '../contracts/adminRead'
import {
  SAFE_BANK_DEPLOYMENT,
} from '../contracts/generated/contracts'

export type AdminConfigurationHealth = {
  savingCoreTokenMatches: boolean
  savingCoreVaultManagerMatches: boolean
  vaultManagerTokenMatches: boolean
  vaultManagerSavingCoreMatches: boolean
  allRelationshipsValid: boolean
}

function addressesMatch(
  firstAddress: string,
  secondAddress: string,
): boolean {
  return (
    getAddress(firstAddress) ===
    getAddress(secondAddress)
  )
}

export function deriveAdminConfigurationHealth(
  configuration: AdminConfiguration,
): AdminConfigurationHealth {
  const savingCoreTokenMatches =
    addressesMatch(
      configuration.savingCoreToken,
      SAFE_BANK_DEPLOYMENT.contracts
        .MockUSDC.address,
    )

  const savingCoreVaultManagerMatches =
    addressesMatch(
      configuration.savingCoreVaultManager,
      SAFE_BANK_DEPLOYMENT.contracts
        .VaultManager.address,
    )

  const vaultManagerTokenMatches =
    addressesMatch(
      configuration.vaultManagerToken,
      SAFE_BANK_DEPLOYMENT.contracts
        .MockUSDC.address,
    )

  const vaultManagerSavingCoreMatches =
    addressesMatch(
      configuration.vaultManagerSavingCore,
      SAFE_BANK_DEPLOYMENT.contracts
        .SavingCore.address,
    )

  return {
    savingCoreTokenMatches,
    savingCoreVaultManagerMatches,
    vaultManagerTokenMatches,
    vaultManagerSavingCoreMatches,
    allRelationshipsValid:
      savingCoreTokenMatches &&
      savingCoreVaultManagerMatches &&
      vaultManagerTokenMatches &&
      vaultManagerSavingCoreMatches,
  }
}