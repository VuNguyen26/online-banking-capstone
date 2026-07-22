import { vi } from 'vitest'

import {
  SAFE_BANK_DEPLOYMENT,
} from './generated/contracts'
import type {
  DepositRecord,
} from './models'
import {
  loadSafeBankDashboard,
} from './dashboard'

const ACCOUNT =
  '0x1111111111111111111111111111111111111111'

const PENDING_INTEREST_CLAIM = {
  depositId: 9n,
  amount: 8_000_000n,
  claimant: ACCOUNT,
}

const OWNED_DEPOSIT:
  DepositRecord = {
    depositId: 7n,
    planId: 1n,
    principal: 500_000_000n,
    startedAt: 1_000n,
    maturityAt: 2_000n,
    tenorDays: 180n,
    aprBpsAtOpen: 200n,
    penaltyBpsAtOpen: 750n,
    status: 0n,
  }

function createDashboardDependencies() {
  const savingCore = {
    planCount: vi.fn(async () => 1n),
    getPlan: vi.fn(async () => [
      180n,
      200n,
      100_000_000n,
      10_000_000_000n,
      750n,
      true,
    ]),
    depositCount: vi.fn(async () => 0n),
    paused: vi.fn(async () => false),
    totalReservedInterest:
      vi.fn(async () => 0n),
    GRACE_PERIOD:
      vi.fn(async () => 172_800n),
    BPS_DENOMINATOR:
      vi.fn(async () => 10_000n),
  }

  const vaultManager = {
    paused: vi.fn(async () => false),
    vaultBalance:
      vi.fn(async () => 0n),
    totalReservedInterest:
      vi.fn(async () => 0n),
    availableLiquidity:
      vi.fn(async () => 0n),
    fundingShortfall:
      vi.fn(async () => 0n),
  }

  const mockUsdc = {
    balanceOf: vi.fn(
      async () => 5_000_000_000n,
    ),
    allowance: vi.fn(
      async () => 100_000_000n,
    ),
  }

  const provider = {
    getBlock: vi.fn<
      () => Promise<{
        timestamp: number
      } | null>
    >(async () => ({
      timestamp: 1_700_000_000,
    })),
  }

  return {
    provider,
    contracts: {
      mockUsdc,
      vaultManager,
      savingCore,
    },
  }
}

describe('SafeBank dashboard data loader', () => {
  it('loads public state without scanning wallet data when disconnected', async () => {
    const dependencies =
      createDashboardDependencies()

    const ownedDepositsReader =
      vi.fn(async () => [
        OWNED_DEPOSIT,
      ])

    const pendingInterestClaimsReader =
      vi.fn(async () => [
        PENDING_INTEREST_CLAIM,
      ])

    const dashboard =
      await loadSafeBankDashboard({
        ...dependencies,
        account: null,
        ownedDepositsReader,
        pendingInterestClaimsReader,
      })

    expect(dashboard.plans).toEqual([
      {
        planId: 1n,
        tenorDays: 180n,
        aprBps: 200n,
        minDeposit: 100_000_000n,
        maxDeposit: 10_000_000_000n,
        earlyWithdrawPenaltyBps: 750n,
        enabled: true,
      },
    ])

    expect(
      dashboard.ownedDeposits,
    ).toEqual([])

    expect(
      dashboard.pendingInterestClaims,
    ).toEqual([])

    expect(
      ownedDepositsReader,
    ).not.toHaveBeenCalled()

    expect(
      pendingInterestClaimsReader,
    ).not.toHaveBeenCalled()

    expect(dashboard.protocolStatus).toEqual({
      planCount: 1n,
      depositCount: 0n,
      savingCorePaused: false,
      vaultManagerPaused: false,
      totalReservedInterest: 0n,
      gracePeriodSeconds: 172_800n,
      bpsDenominator: 10_000n,
      latestBlockTimestamp:
        1_700_000_000n,
    })

    expect(dashboard.vaultMetrics).toEqual({
      vaultBalance: 0n,
      totalReservedInterest: 0n,
      availableLiquidity: 0n,
      fundingShortfall: 0n,
    })

    expect(
      dashboard.tokenAccountState,
    ).toBeNull()

    expect(
      dependencies.contracts.mockUsdc
        .balanceOf,
    ).not.toHaveBeenCalled()

    expect(
      dependencies.contracts.mockUsdc
        .allowance,
    ).not.toHaveBeenCalled()
  })

  it('loads account state, owned deposits and independent C1 claims', async () => {
    const dependencies =
      createDashboardDependencies()

    const ownedDepositsReader =
      vi.fn(async () => [
        OWNED_DEPOSIT,
      ])

    const pendingInterestClaimsReader =
      vi.fn(async () => [
        PENDING_INTEREST_CLAIM,
      ])

    const dashboard =
      await loadSafeBankDashboard({
        ...dependencies,
        account: ACCOUNT,
        ownedDepositsReader,
        pendingInterestClaimsReader,
      })

    expect(
      dashboard.tokenAccountState,
    ).toEqual({
      balance: 5_000_000_000n,
      allowance: 100_000_000n,
    })

    expect(
      dashboard.ownedDeposits,
    ).toEqual([
      OWNED_DEPOSIT,
    ])

    expect(
      dashboard.pendingInterestClaims,
    ).toEqual([
      PENDING_INTEREST_CLAIM,
    ])

    expect(
      ownedDepositsReader,
    ).toHaveBeenCalledWith(
      dependencies.provider,
      dependencies.contracts.savingCore,
      ACCOUNT,
    )

    expect(
      pendingInterestClaimsReader,
    ).toHaveBeenCalledWith(
      dependencies.provider,
      dependencies.contracts.savingCore,
      ACCOUNT,
    )

    expect(
      dependencies.contracts.mockUsdc
        .balanceOf,
    ).toHaveBeenCalledWith(
      ACCOUNT,
    )

    expect(
      dependencies.contracts.mockUsdc
        .allowance,
    ).toHaveBeenCalledWith(
      ACCOUNT,
      SAFE_BANK_DEPLOYMENT.contracts
        .SavingCore.address,
    )
  })

  it('rejects the complete snapshot when a required public read fails', async () => {
    const dependencies =
      createDashboardDependencies()

    dependencies.provider.getBlock
      .mockResolvedValue(null)

    await expect(
      loadSafeBankDashboard({
        ...dependencies,
        account: null,
      }),
    ).rejects.toThrow(
      'latest Sepolia block could not be loaded',
    )
  })
})
