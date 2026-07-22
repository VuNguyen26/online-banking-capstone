import { vi } from 'vitest'

import type {
  DepositRecord,
} from './models'
import {
  readWalletOwnedDeposits,
} from './walletDeposits'

const ACCOUNT =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const DEPOSIT: DepositRecord = {
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

describe('wallet-owned deposit reads', () => {
  it('does not scan NFT logs for a disconnected wallet', async () => {
    const reader = vi.fn(
      async () => [DEPOSIT],
    )

    await expect(
      readWalletOwnedDeposits(
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

  it('loads owned deposits for a connected account', async () => {
    const provider = {
      name: 'provider',
    }

    const savingCore = {
      name: 'saving-core',
    }

    const reader = vi.fn(
      async () => [DEPOSIT],
    )

    await expect(
      readWalletOwnedDeposits(
        provider,
        savingCore,
        ACCOUNT,
        reader,
      ),
    ).resolves.toEqual([
      DEPOSIT,
    ])

    expect(reader).toHaveBeenCalledWith(
      provider,
      savingCore,
      ACCOUNT,
    )
  })
})
