import { Interface } from 'ethers'
import { vi } from 'vitest'

import {
  MOCK_USDC_ABI,
  SAFE_BANK_DEPLOYMENT,
  SAVING_CORE_ABI,
} from './generated/contracts'
import {
  approveSavingCore,
  automaticallyRenewDeposit,
  claimDepositPendingInterest,
  earlyWithdrawDeposit,
  manuallyRenewDeposit,
  mintMockUsdc,
  openSavingDeposit,
  withdrawDepositAtMaturity,
} from './write'
import type {
  SubmittedTransactionLike,
} from '../hooks/useTransaction'

const TRANSACTION_HASH =
  `0x${'b'.repeat(64)}`

function createTransaction():
  SubmittedTransactionLike {
  return {
    hash: TRANSACTION_HASH,
    wait: async () => ({
      status: 1,
    }),
  }
}

describe('SafeBank user write layer', () => {
  it('matches all exact required ABI signatures', () => {
    const tokenInterface =
      new Interface(MOCK_USDC_ABI)

    const coreInterface =
      new Interface(SAVING_CORE_ABI)

    expect(
      tokenInterface.getFunction(
        'mint(address,uint256)',
      ),
    ).not.toBeNull()

    expect(
      tokenInterface.getFunction(
        'approve(address,uint256)',
      ),
    ).not.toBeNull()

    expect(
      coreInterface.getFunction(
        'openDeposit(uint256,uint256)',
      ),
    ).not.toBeNull()

    expect(
      coreInterface.getFunction(
        'earlyWithdraw(uint256)',
      ),
    ).not.toBeNull()

    expect(
      coreInterface.getFunction(
        'withdrawAtMaturity(uint256)',
      ),
    ).not.toBeNull()

    expect(
      coreInterface.getFunction(
        'manualRenew(uint256,uint256)',
      ),
    ).not.toBeNull()

    expect(
      coreInterface.getFunction(
        'autoRenew(uint256)',
      ),
    ).not.toBeNull()

    expect(
      coreInterface.getFunction(
        'claimPendingInterest(uint256)',
      ),
    ).not.toBeNull()
  })

  it('mints test mUSDC to the exact recipient', async () => {
    const transaction = createTransaction()
    const mint = vi.fn(async () => transaction)

    await expect(
      mintMockUsdc(
        { mint },
        '0x1111111111111111111111111111111111111111',
        1_000_000_000n,
      ),
    ).resolves.toBe(transaction)

    expect(mint).toHaveBeenCalledWith(
      '0x1111111111111111111111111111111111111111',
      1_000_000_000n,
    )
  })

  it('approves the canonical SavingCore address for an exact amount', async () => {
    const transaction =
      createTransaction()

    const approve = vi.fn(
      async () => transaction,
    )

    await expect(
      approveSavingCore(
        {
          approve,
        },
        100_000_000n,
      ),
    ).resolves.toBe(transaction)

    expect(approve).toHaveBeenCalledWith(
      SAFE_BANK_DEPLOYMENT.contracts
        .SavingCore.address,
      100_000_000n,
    )
  })

  it('opens a deposit with the exact plan ID and amount', async () => {
    const transaction =
      createTransaction()

    const openDeposit = vi.fn(
      async () => transaction,
    )

    await expect(
      openSavingDeposit(
        {
          openDeposit,
        },
        1n,
        500_000_000n,
      ),
    ).resolves.toBe(transaction)

    expect(
      openDeposit,
    ).toHaveBeenCalledWith(
      1n,
      500_000_000n,
    )
  })

  it('calls both withdrawal actions with the deposit ID', async () => {
    const transaction =
      createTransaction()

    const earlyWithdraw = vi.fn(
      async () => transaction,
    )

    const withdrawAtMaturity = vi.fn(
      async () => transaction,
    )

    const savingCore = {
      earlyWithdraw,
      withdrawAtMaturity,
    }

    await expect(
      earlyWithdrawDeposit(
        savingCore,
        7n,
      ),
    ).resolves.toBe(transaction)

    await expect(
      withdrawDepositAtMaturity(
        savingCore,
        7n,
      ),
    ).resolves.toBe(transaction)

    expect(
      earlyWithdraw,
    ).toHaveBeenCalledWith(7n)

    expect(
      withdrawAtMaturity,
    ).toHaveBeenCalledWith(7n)
  })

  it('calls manual and permissionless auto-renew with exact arguments', async () => {
    const transaction =
      createTransaction()

    const manualRenew = vi.fn(
      async () => transaction,
    )

    const autoRenew = vi.fn(
      async () => transaction,
    )

    const savingCore = {
      manualRenew,
      autoRenew,
    }

    await expect(
      manuallyRenewDeposit(
        savingCore,
        7n,
        2n,
      ),
    ).resolves.toBe(transaction)

    await expect(
      automaticallyRenewDeposit(
        savingCore,
        7n,
      ),
    ).resolves.toBe(transaction)

    expect(
      manualRenew,
    ).toHaveBeenCalledWith(7n, 2n)

    expect(
      autoRenew,
    ).toHaveBeenCalledWith(7n)
  })

  it('claims pending interest for the exact deposit ID', async () => {
    const transaction =
      createTransaction()

    const claimPendingInterest = vi.fn(
      async () => transaction,
    )

    await expect(
      claimDepositPendingInterest(
        {
          claimPendingInterest,
        },
        9n,
      ),
    ).resolves.toBe(transaction)

    expect(
      claimPendingInterest,
    ).toHaveBeenCalledWith(9n)
  })

  it('rejects zero or negative financial amounts before calling a contract', async () => {
    const approve = vi.fn()
    const openDeposit = vi.fn()

    await expect(
      approveSavingCore(
        {
          approve,
        },
        0n,
      ),
    ).rejects.toThrow(
      'approvalAmount must be a positive bigint',
    )

    await expect(
      openSavingDeposit(
        {
          openDeposit,
        },
        1n,
        -1n,
      ),
    ).rejects.toThrow(
      'depositAmount must be a positive bigint',
    )

    expect(approve).not.toHaveBeenCalled()
    expect(
      openDeposit,
    ).not.toHaveBeenCalled()
  })

  it('rejects invalid plan and deposit IDs before calling a contract', async () => {
    const openDeposit = vi.fn()
    const earlyWithdraw = vi.fn()
    const manualRenew = vi.fn()

    await expect(
      openSavingDeposit(
        {
          openDeposit,
        },
        0n,
        100_000_000n,
      ),
    ).rejects.toThrow(
      'planId must be a positive bigint',
    )

    await expect(
      earlyWithdrawDeposit(
        {
          earlyWithdraw,
        },
        0n,
      ),
    ).rejects.toThrow(
      'depositId must be a positive bigint',
    )

    await expect(
      manuallyRenewDeposit(
        {
          manualRenew,
        },
        1n,
        0n,
      ),
    ).rejects.toThrow(
      'newPlanId must be a positive bigint',
    )

    expect(
      openDeposit,
    ).not.toHaveBeenCalled()

    expect(
      earlyWithdraw,
    ).not.toHaveBeenCalled()

    expect(
      manualRenew,
    ).not.toHaveBeenCalled()
  })
})
