import {
  Interface,
  zeroPadValue,
} from 'ethers'
import { vi } from 'vitest'

import {
  SAFE_BANK_DEPLOYMENT,
  SAVING_CORE_ABI,
} from './generated/contracts'
import {
  readPendingInterestClaims,
  readWalletPendingInterestClaims,
  scanDeferredInterestDepositIds,
} from './pendingInterest'

const ACCOUNT =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const OTHER_ACCOUNT =
  '0x1111111111111111111111111111111111111111'

const savingCoreInterface =
  new Interface(SAVING_CORE_ABI)

function requireInterestDeferredEvent() {
  const event =
    savingCoreInterface.getEvent(
      'InterestDeferred(uint256,address,uint256)',
    )

  if (!event) {
    throw new Error(
      'InterestDeferred event missing in test ABI.',
    )
  }

  return event
}

const interestDeferredEvent =
  requireInterestDeferredEvent()

function createInterestDeferredLog(
  depositId: bigint,
  claimant: string,
  amount: bigint,
) {
  return savingCoreInterface.encodeEventLog(
    interestDeferredEvent,
    [
      depositId,
      claimant,
      amount,
    ],
  )
}

describe('C1 pending-interest discovery', () => {
  it('scans claimant-indexed logs in bounded ranges and deduplicates IDs', async () => {
    const deploymentBlock =
      SAFE_BANK_DEPLOYMENT.contracts
        .SavingCore.deploymentBlockNumber

    const firstLog =
      createInterestDeferredLog(
        1n,
        ACCOUNT,
        5_000_000n,
      )

    const secondLog =
      createInterestDeferredLog(
        2n,
        ACCOUNT,
        7_000_000n,
      )

    const provider = {
      getBlockNumber: vi.fn(
        async () =>
          deploymentBlock + 10_500,
      ),
      getLogs: vi
        .fn()
        .mockResolvedValueOnce([
          firstLog,
        ])
        .mockResolvedValueOnce([
          firstLog,
          secondLog,
        ])
        .mockResolvedValueOnce([]),
    }

    await expect(
      scanDeferredInterestDepositIds(
        provider,
        ACCOUNT,
        5_000,
      ),
    ).resolves.toEqual([
      1n,
      2n,
    ])

    expect(
      provider.getLogs,
    ).toHaveBeenCalledTimes(3)

    expect(
      provider.getLogs,
    ).toHaveBeenNthCalledWith(
      1,
      {
        address:
          SAFE_BANK_DEPLOYMENT.contracts
            .SavingCore.address,
        fromBlock: deploymentBlock,
        toBlock:
          deploymentBlock + 4_999,
        topics: [
          interestDeferredEvent.topicHash,
          null,
          zeroPadValue(
            ACCOUNT,
            32,
          ),
        ],
      },
    )

    expect(
      provider.getLogs,
    ).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        fromBlock:
          deploymentBlock + 10_000,
        toBlock:
          deploymentBlock + 10_500,
      }),
    )
  })

  it('keeps only positive claims whose current claimant still matches', async () => {
    const provider = {
      getBlockNumber: vi.fn(
        async () =>
          SAFE_BANK_DEPLOYMENT.contracts
            .SavingCore.deploymentBlockNumber,
      ),
      getLogs: vi.fn(
        async () => [
          createInterestDeferredLog(
            1n,
            ACCOUNT,
            5_000_000n,
          ),
          createInterestDeferredLog(
            2n,
            ACCOUNT,
            7_000_000n,
          ),
          createInterestDeferredLog(
            3n,
            ACCOUNT,
            9_000_000n,
          ),
        ],
      ),
    }

    const pendingInterest = vi.fn(
      async (depositId: bigint) => {
        if (depositId === 2n) {
          return 0n
        }

        return 5_000_000n
      },
    )

    const interestClaimant = vi.fn(
      async (depositId: bigint) =>
        depositId === 3n
          ? OTHER_ACCOUNT
          : ACCOUNT,
    )

    await expect(
      readPendingInterestClaims(
        provider,
        {
          pendingInterest,
          interestClaimant,
        },
        ACCOUNT,
      ),
    ).resolves.toEqual([
      {
        depositId: 1n,
        amount: 5_000_000n,
        claimant: ACCOUNT,
      },
    ])

    expect(
      pendingInterest,
    ).toHaveBeenCalledTimes(3)

    expect(
      interestClaimant,
    ).toHaveBeenCalledTimes(3)
  })

  it('does not scan deferred-interest logs while disconnected', async () => {
    const reader = vi.fn(
      async () => [
        {
          depositId: 1n,
          amount: 5_000_000n,
          claimant: ACCOUNT,
        },
      ],
    )

    await expect(
      readWalletPendingInterestClaims(
        {
          name: 'provider',
        },
        {
          name: 'saving-core',
        },
        null,
        reader,
      ),
    ).resolves.toEqual([])

    expect(reader).not.toHaveBeenCalled()
  })

  it('loads claims for the connected wallet independently from NFT ownership', async () => {
    const provider = {
      name: 'provider',
    }

    const savingCore = {
      name: 'saving-core',
    }

    const claims = [
      {
        depositId: 9n,
        amount: 8_000_000n,
        claimant: ACCOUNT,
      },
    ]

    const reader = vi.fn(
      async () => claims,
    )

    await expect(
      readWalletPendingInterestClaims(
        provider,
        savingCore,
        ACCOUNT,
        reader,
      ),
    ).resolves.toEqual(claims)

    expect(reader).toHaveBeenCalledWith(
      provider,
      savingCore,
      ACCOUNT,
    )
  })

  it('returns no candidates when the RPC is behind deployment', async () => {
    const deploymentBlock =
      SAFE_BANK_DEPLOYMENT.contracts
        .SavingCore.deploymentBlockNumber

    const provider = {
      getBlockNumber: vi.fn(
        async () =>
          deploymentBlock - 1,
      ),
      getLogs: vi.fn(),
    }

    await expect(
      scanDeferredInterestDepositIds(
        provider,
        ACCOUNT,
      ),
    ).resolves.toEqual([])

    expect(
      provider.getLogs,
    ).not.toHaveBeenCalled()
  })

  it('rejects invalid claimant addresses and block ranges before scanning', async () => {
    const provider = {
      getBlockNumber: vi.fn(
        async () =>
          SAFE_BANK_DEPLOYMENT.contracts
            .SavingCore.deploymentBlockNumber,
      ),
      getLogs: vi.fn(),
    }

    await expect(
      scanDeferredInterestDepositIds(
        provider,
        'invalid-address',
      ),
    ).rejects.toThrow()

    await expect(
      scanDeferredInterestDepositIds(
        provider,
        ACCOUNT,
        0,
      ),
    ).rejects.toThrow(
      'blockRange must be a positive safe integer',
    )

    expect(
      provider.getLogs,
    ).not.toHaveBeenCalled()
  })
})
