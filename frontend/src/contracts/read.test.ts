import {
  readLatestBlockTimestamp,
  readProtocolStatus,
  readSavingPlans,
  readTokenAccountState,
  readVaultMetrics,
} from './read'

describe('SafeBank read layer', () => {
  it('reads every saving plan using bigint IDs', async () => {
    const savingCore = {
      planCount: async () => 2n,
      getPlan: async (planId: bigint) => [
        planId === 1n ? 180n : 365n,
        planId === 1n ? 200n : 350n,
        100_000_000n,
        10_000_000_000n,
        750n,
        true,
      ],
    }

    await expect(
      readSavingPlans(savingCore),
    ).resolves.toEqual([
      {
        planId: 1n,
        tenorDays: 180n,
        aprBps: 200n,
        minDeposit: 100_000_000n,
        maxDeposit: 10_000_000_000n,
        earlyWithdrawPenaltyBps: 750n,
        enabled: true,
      },
      {
        planId: 2n,
        tenorDays: 365n,
        aprBps: 350n,
        minDeposit: 100_000_000n,
        maxDeposit: 10_000_000_000n,
        earlyWithdrawPenaltyBps: 750n,
        enabled: true,
      },
    ])
  })

  it('reads C2 vault metrics', async () => {
    const vaultManager = {
      vaultBalance: async () =>
        1_000_000_000n,
      totalReservedInterest:
        async () => 800_000_000n,
      availableLiquidity:
        async () => 200_000_000n,
      fundingShortfall: async () => 0n,
    }

    await expect(
      readVaultMetrics(vaultManager),
    ).resolves.toEqual({
      vaultBalance: 1_000_000_000n,
      totalReservedInterest:
        800_000_000n,
      availableLiquidity:
        200_000_000n,
      fundingShortfall: 0n,
    })
  })

  it('reads a wallet token balance and exact allowance', async () => {
    const mockUsdc = {
      balanceOf: async (
        account: string,
      ) => {
        expect(account).toBe(
          '0x1111111111111111111111111111111111111111',
        )

        return 5_000_000_000n
      },
      allowance: async (
        owner: string,
        spender: string,
      ) => {
        expect(owner).toBe(
          '0x1111111111111111111111111111111111111111',
        )

        expect(spender).toBe(
          '0x2222222222222222222222222222222222222222',
        )

        return 100_000_000n
      },
    }

    await expect(
      readTokenAccountState(
        mockUsdc,
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222',
      ),
    ).resolves.toEqual({
      balance: 5_000_000_000n,
      allowance: 100_000_000n,
    })
  })

  it('reads protocol status using the latest block timestamp', async () => {
    const savingCore = {
      planCount: async () => 1n,
      depositCount: async () => 0n,
      paused: async () => false,
      totalReservedInterest:
        async () => 0n,
      GRACE_PERIOD: async () => 172_800n,
      BPS_DENOMINATOR:
        async () => 10_000n,
    }

    const vaultManager = {
      paused: async () => false,
    }

    const provider = {
      getBlock: async (
        blockTag: string,
      ) => {
        expect(blockTag).toBe('latest')

        return {
          timestamp: 1_700_000_000,
        }
      },
    }

    await expect(
      readProtocolStatus(
        savingCore,
        vaultManager,
        provider,
      ),
    ).resolves.toEqual({
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
  })

  it('rejects a missing latest block', async () => {
    const provider = {
      getBlock: async () => null,
    }

    await expect(
      readLatestBlockTimestamp(provider),
    ).rejects.toThrow(
      'latest Sepolia block could not be loaded',
    )
  })
})
