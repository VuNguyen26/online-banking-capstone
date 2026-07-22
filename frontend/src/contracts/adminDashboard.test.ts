import {
  ZeroAddress,
  getAddress,
} from 'ethers'
import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  loadAdminDashboard,
} from './adminDashboard'

const TOKEN =
  '0xcf779ec5d80573d3254054a17c5b4f0117491662'
const VAULT =
  '0xa79f660fab4ebae6ac4298034cb3fd6d28e5d2f7'
const CORE =
  '0xa35c55e7e2db5874699cc9fb8d0e25032f51b443'
const OWNER =
  '0xa998526b0a5f23680f50fa3677f5c6576dba89d9'

function createContracts() {
  return {
    mockUsdc: {
      balanceOf: async () => 5000000n,
      allowance: async () => 2500000n,
    },
    savingCore: {
      owner: async () => OWNER,
      pendingOwner: async () =>
        ZeroAddress,
      token: async () => TOKEN,
      vaultManager: async () => VAULT,
      paused: async () => false,
      planCount: async () => 1n,
      depositCount: async () => 3n,
      getPlan: async () => ({
        tenorDays: 180n,
        aprBps: 200n,
        minDeposit: 100000000n,
        maxDeposit: 10000000000n,
        earlyWithdrawPenaltyBps: 750n,
        enabled: true,
      }),
    },
    vaultManager: {
      owner: async () => OWNER,
      pendingOwner: async () =>
        ZeroAddress,
      feeReceiver: async () => OWNER,
      token: async () => TOKEN,
      savingCore: async () => CORE,
      paused: async () => false,
      vaultBalance: async () =>
        1000000000n,
      totalReservedInterest:
        async () => 200000000n,
      availableLiquidity:
        async () => 800000000n,
      fundingShortfall:
        async () => 0n,
    },
  }
}

describe('admin dashboard loader', () => {
  it('loads public data and separate ownership flags', async () => {
    const result =
      await loadAdminDashboard({
        contracts: createContracts(),
        account: OWNER.toLowerCase(),
      })

    expect(result.depositCount).toBe(3n)
    expect(result.plans).toHaveLength(1)
    expect(result.vaultMetrics).toEqual({
      vaultBalance: 1000000000n,
      totalReservedInterest:
        200000000n,
      availableLiquidity:
        800000000n,
      fundingShortfall: 0n,
    })
    expect(result.authorization).toEqual({
      isSavingCoreOwner: true,
      isVaultManagerOwner: true,
      isSavingCorePendingOwner: false,
      isVaultManagerPendingOwner: false,
    })
    expect(result.tokenAccountState).toEqual({
      balance: 5000000n,
      vaultManagerAllowance: 2500000n,
    })
    expect(
      result.configuration.savingCoreToken,
    ).toBe(getAddress(TOKEN))
  })

  it('keeps public admin data available without a wallet', async () => {
    const result =
      await loadAdminDashboard({
        contracts: createContracts(),
        account: null,
      })

    expect(result.tokenAccountState).toBeNull()
    expect(result.authorization).toEqual({
      isSavingCoreOwner: false,
      isVaultManagerOwner: false,
      isSavingCorePendingOwner: false,
      isVaultManagerPendingOwner: false,
    })
    expect(result.plans).toHaveLength(1)
  })
})