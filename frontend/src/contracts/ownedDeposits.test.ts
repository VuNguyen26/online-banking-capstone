import {
  Interface,
  ZeroAddress,
  zeroPadValue,
} from 'ethers'
import { vi } from 'vitest'

import {
  SAFE_BANK_DEPLOYMENT,
  SAVING_CORE_ABI,
} from './generated/contracts'
import {
  readOwnedDeposits,
  scanIncomingDepositIds,
} from './ownedDeposits'

const ACCOUNT =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const OTHER_ACCOUNT =
  '0x1111111111111111111111111111111111111111'

const savingCoreInterface =
  new Interface(SAVING_CORE_ABI)

function requireTransferEvent() {
  const event =
    savingCoreInterface.getEvent(
      'Transfer(address,address,uint256)',
    )

  if (!event) {
    throw new Error(
      'Transfer event missing in test ABI.',
    )
  }

  return event
}

const transferEvent =
  requireTransferEvent()

function createTransferLog(
  from: string,
  to: string,
  depositId: bigint,
) {
  return savingCoreInterface.encodeEventLog(
    transferEvent,
    [
      from,
      to,
      depositId,
    ],
  )
}

describe('owned SafeBank deposit discovery', () => {
  it('scans incoming transfers in bounded block ranges and deduplicates IDs', async () => {
    const deploymentBlock =
      SAFE_BANK_DEPLOYMENT.contracts
        .SavingCore.deploymentBlockNumber

    const firstLog =
      createTransferLog(
        ZeroAddress,
        ACCOUNT,
        1n,
      )

    const secondLog =
      createTransferLog(
        OTHER_ACCOUNT,
        ACCOUNT,
        2n,
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
      scanIncomingDepositIds(
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
          transferEvent.topicHash,
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

  it('reconciles candidates with ownerOf before loading deposits', async () => {
    const firstLog =
      createTransferLog(
        ZeroAddress,
        ACCOUNT,
        1n,
      )

    const secondLog =
      createTransferLog(
        ZeroAddress,
        ACCOUNT,
        2n,
      )

    const provider = {
      getBlockNumber: vi.fn(
        async () =>
          SAFE_BANK_DEPLOYMENT.contracts
            .SavingCore.deploymentBlockNumber,
      ),
      getLogs: vi.fn(
        async () => [
          firstLog,
          secondLog,
        ],
      ),
    }

    const ownerOf = vi.fn(
      async (depositId: bigint) =>
        depositId === 1n
          ? ACCOUNT
          : OTHER_ACCOUNT,
    )

    const getDeposit = vi.fn(
      async () => [
        1n,
        500_000_000n,
        1_000n,
        2_000n,
        180n,
        200n,
        750n,
        0n,
      ],
    )

    await expect(
      readOwnedDeposits(
        provider,
        {
          ownerOf,
          getDeposit,
        },
        ACCOUNT,
      ),
    ).resolves.toEqual([
      {
        depositId: 1n,
        planId: 1n,
        principal: 500_000_000n,
        startedAt: 1_000n,
        maturityAt: 2_000n,
        tenorDays: 180n,
        aprBpsAtOpen: 200n,
        penaltyBpsAtOpen: 750n,
        status: 0n,
      },
    ])

    expect(ownerOf).toHaveBeenCalledWith(
      1n,
    )

    expect(ownerOf).toHaveBeenCalledWith(
      2n,
    )

    expect(getDeposit).toHaveBeenCalledTimes(
      1,
    )

    expect(getDeposit).toHaveBeenCalledWith(
      1n,
    )
  })

  it('does not call ownerOf when no incoming transfer exists', async () => {
    const provider = {
      getBlockNumber: vi.fn(
        async () =>
          SAFE_BANK_DEPLOYMENT.contracts
            .SavingCore.deploymentBlockNumber,
      ),
      getLogs: vi.fn(
        async () => [],
      ),
    }

    const ownerOf = vi.fn()
    const getDeposit = vi.fn()

    await expect(
      readOwnedDeposits(
        provider,
        {
          ownerOf,
          getDeposit,
        },
        ACCOUNT,
      ),
    ).resolves.toEqual([])

    expect(ownerOf).not.toHaveBeenCalled()
    expect(
      getDeposit,
    ).not.toHaveBeenCalled()
  })

  it('ignores candidate IDs that no longer resolve through ownerOf', async () => {
    const provider = {
      getBlockNumber: vi.fn(
        async () =>
          SAFE_BANK_DEPLOYMENT.contracts
            .SavingCore.deploymentBlockNumber,
      ),
      getLogs: vi.fn(
        async () => [
          createTransferLog(
            ZeroAddress,
            ACCOUNT,
            3n,
          ),
        ],
      ),
    }

    const ownerOf = vi.fn(
      async () => {
        throw new Error(
          'ERC721NonexistentToken',
        )
      },
    )

    const getDeposit = vi.fn()

    await expect(
      readOwnedDeposits(
        provider,
        {
          ownerOf,
          getDeposit,
        },
        ACCOUNT,
      ),
    ).resolves.toEqual([])

    expect(
      getDeposit,
    ).not.toHaveBeenCalled()
  })

  it('returns no IDs when the provider is behind the deployment block', async () => {
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
      scanIncomingDepositIds(
        provider,
        ACCOUNT,
      ),
    ).resolves.toEqual([])

    expect(
      provider.getLogs,
    ).not.toHaveBeenCalled()
  })

  it('rejects invalid accounts and block ranges before scanning logs', async () => {
    const provider = {
      getBlockNumber: vi.fn(
        async () =>
          SAFE_BANK_DEPLOYMENT.contracts
            .SavingCore.deploymentBlockNumber,
      ),
      getLogs: vi.fn(),
    }

    await expect(
      scanIncomingDepositIds(
        provider,
        'invalid-address',
      ),
    ).rejects.toThrow()

    await expect(
      scanIncomingDepositIds(
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

  it('falls back to depositCount when the RPC rejects log ranges', async () => {
    const provider = {
      getBlockNumber: vi.fn(
        async () =>
          SAFE_BANK_DEPLOYMENT.contracts
            .SavingCore.deploymentBlockNumber,
      ),
      getLogs: vi.fn(
        async () => {
          throw new Error(
            'RPC block range is too large',
          )
        },
      ),
    }

    const depositCount = vi.fn(
      async () => 2n,
    )

    const ownerOf = vi.fn(
      async (depositId: bigint) =>
        depositId === 1n
          ? ACCOUNT
          : OTHER_ACCOUNT,
    )

    const getDeposit = vi.fn(
      async () => [
        1n,
        500_000_000n,
        1_000n,
        2_000n,
        180n,
        200n,
        750n,
        0n,
      ],
    )

    await expect(
      readOwnedDeposits(
        provider,
        {
          depositCount,
          ownerOf,
          getDeposit,
        },
        ACCOUNT,
      ),
    ).resolves.toEqual([
      {
        depositId: 1n,
        planId: 1n,
        principal: 500_000_000n,
        startedAt: 1_000n,
        maturityAt: 2_000n,
        tenorDays: 180n,
        aprBpsAtOpen: 200n,
        penaltyBpsAtOpen: 750n,
        status: 0n,
      },
    ])

    expect(provider.getLogs).toHaveBeenCalledTimes(1)
    expect(depositCount).toHaveBeenCalledTimes(1)
    expect(ownerOf).toHaveBeenCalledTimes(2)
    expect(getDeposit).toHaveBeenCalledWith(1n)
  })
})
