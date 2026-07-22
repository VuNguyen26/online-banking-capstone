import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  AdminConfiguration,
} from '../contracts/adminRead'
import {
  SAFE_BANK_DEPLOYMENT,
} from '../contracts/generated/contracts'
import {
  deriveAdminConfigurationHealth,
} from './adminConfigurationHealth'

const OWNER =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000'

const OTHER_ADDRESS =
  '0x1111111111111111111111111111111111111111'

function createConfiguration(
  overrides:
    Partial<AdminConfiguration> = {},
): AdminConfiguration {
  return {
    savingCoreOwner: OWNER,
    savingCorePendingOwner:
      ZERO_ADDRESS,
    vaultManagerOwner: OWNER,
    vaultManagerPendingOwner:
      ZERO_ADDRESS,
    feeReceiver: OWNER,
    savingCoreToken:
      SAFE_BANK_DEPLOYMENT.contracts
        .MockUSDC.address,
    savingCoreVaultManager:
      SAFE_BANK_DEPLOYMENT.contracts
        .VaultManager.address,
    vaultManagerToken:
      SAFE_BANK_DEPLOYMENT.contracts
        .MockUSDC.address,
    vaultManagerSavingCore:
      SAFE_BANK_DEPLOYMENT.contracts
        .SavingCore.address,
    savingCorePaused: false,
    vaultManagerPaused: false,
    ...overrides,
  }
}

describe('admin configuration health', () => {
  it('accepts the synchronized deployment relationships', () => {
    expect(
      deriveAdminConfigurationHealth(
        createConfiguration(),
      ),
    ).toEqual({
      savingCoreTokenMatches: true,
      savingCoreVaultManagerMatches: true,
      vaultManagerTokenMatches: true,
      vaultManagerSavingCoreMatches: true,
      allRelationshipsValid: true,
    })
  })

  it('reports each mismatched relationship independently', () => {
    expect(
      deriveAdminConfigurationHealth(
        createConfiguration({
          savingCoreToken:
            OTHER_ADDRESS,
          vaultManagerSavingCore:
            OTHER_ADDRESS,
        }),
      ),
    ).toEqual({
      savingCoreTokenMatches: false,
      savingCoreVaultManagerMatches: true,
      vaultManagerTokenMatches: true,
      vaultManagerSavingCoreMatches: false,
      allRelationshipsValid: false,
    })
  })

  it('normalizes address casing before comparison', () => {
    const configuration =
      createConfiguration({
        savingCoreToken:
          SAFE_BANK_DEPLOYMENT.contracts
            .MockUSDC.address
            .toLowerCase(),
        savingCoreVaultManager:
          SAFE_BANK_DEPLOYMENT.contracts
            .VaultManager.address
            .toLowerCase(),
      })

    expect(
      deriveAdminConfigurationHealth(
        configuration,
      ).allRelationshipsValid,
    ).toBe(true)
  })
})