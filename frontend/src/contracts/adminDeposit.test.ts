import {
  Interface,
} from 'ethers'
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  SAVING_CORE_ABI,
} from './generated/contracts'
import {
  readAdminDeposit,
} from './adminDeposit'

describe('admin deposit inspection', () => {
  it('matches the deployed getDeposit ABI', () => {
    const contractInterface =
      new Interface(SAVING_CORE_ABI)

    expect(
      contractInterface.getFunction(
        'getDeposit(uint256)',
      ),
    ).not.toBeNull()
  })

  it('reads and decodes the exact deposit ID', async () => {
    const getDeposit = vi.fn(
      async () => ({
        planId: 1n,
        principal: 100_000_000n,
        startedAt: 1_700_000_000n,
        maturityAt: 1_715_552_000n,
        tenorDays: 180n,
        aprBpsAtOpen: 200n,
        penaltyBpsAtOpen: 750n,
        status: 0n,
      }),
    )

    await expect(
      readAdminDeposit(
        { getDeposit },
        3n,
      ),
    ).resolves.toEqual({
      depositId: 3n,
      planId: 1n,
      principal: 100_000_000n,
      startedAt: 1_700_000_000n,
      maturityAt: 1_715_552_000n,
      tenorDays: 180n,
      aprBpsAtOpen: 200n,
      penaltyBpsAtOpen: 750n,
      status: 0n,
    })

    expect(getDeposit).toHaveBeenCalledWith(
      3n,
    )
  })

  it('rejects invalid IDs before reading the contract', async () => {
    const getDeposit = vi.fn()

    await expect(
      readAdminDeposit(
        { getDeposit },
        0n,
      ),
    ).rejects.toThrow(
      'depositId must be a positive bigint.',
    )

    expect(getDeposit).not.toHaveBeenCalled()
  })
})