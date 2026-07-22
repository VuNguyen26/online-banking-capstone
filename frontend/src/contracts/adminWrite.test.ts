import {
  Interface,
  getAddress,
} from 'ethers'
import { vi } from 'vitest'

import type {
  SubmittedTransactionLike,
} from '../hooks/useTransaction'
import {
  approveVaultManagerFunding,
  createSavingPlan,
  disableSavingPlan,
  enableSavingPlan,
  fundInterestVault,
  pauseSavingCore,
  pauseVaultManager,
  unpauseSavingCore,
  unpauseVaultManager,
  updateSavingPlanApr,
  updateVaultFeeReceiver,
  withdrawInterestVault,
} from './adminWrite'
import {
  MOCK_USDC_ABI,
  SAFE_BANK_DEPLOYMENT,
  SAVING_CORE_ABI,
  VAULT_MANAGER_ABI,
} from './generated/contracts'

const TRANSACTION_HASH =
  `0x${'c'.repeat(64)}`

const FEE_RECEIVER =
  '0x1111111111111111111111111111111111111111'

function createTransaction():
  SubmittedTransactionLike {
  return {
    hash: TRANSACTION_HASH,
    wait: async () => ({
      status: 1,
    }),
  }
}

describe('SafeBank admin write layer', () => {
  it('matches every required admin ABI signature', () => {
    const tokenInterface =
      new Interface(MOCK_USDC_ABI)

    const coreInterface =
      new Interface(SAVING_CORE_ABI)

    const vaultInterface =
      new Interface(VAULT_MANAGER_ABI)

    expect(
      tokenInterface.getFunction(
        'approve(address,uint256)',
      ),
    ).not.toBeNull()

    for (const signature of [
      'createPlan(uint256,uint256,uint256,uint256,uint256,bool)',
      'updatePlan(uint256,uint256)',
      'enablePlan(uint256)',
      'disablePlan(uint256)',
      'pause()',
      'unpause()',
    ]) {
      expect(
        coreInterface.getFunction(
          signature,
        ),
      ).not.toBeNull()
    }

    for (const signature of [
      'fundVault(uint256)',
      'withdrawVault(uint256)',
      'setFeeReceiver(address)',
      'pause()',
      'unpause()',
    ]) {
      expect(
        vaultInterface.getFunction(
          signature,
        ),
      ).not.toBeNull()
    }
  })

  it('approves the canonical VaultManager for an exact amount', async () => {
    const transaction =
      createTransaction()

    const approve = vi.fn(
      async () => transaction,
    )

    await expect(
      approveVaultManagerFunding(
        { approve },
        250_000_000n,
      ),
    ).resolves.toBe(transaction)

    expect(approve).toHaveBeenCalledWith(
      SAFE_BANK_DEPLOYMENT.contracts
        .VaultManager.address,
      250_000_000n,
    )
  })

  it('creates a plan with the exact Solidity argument order', async () => {
    const transaction =
      createTransaction()

    const createPlan = vi.fn(
      async () => transaction,
    )

    await expect(
      createSavingPlan(
        { createPlan },
        {
          tenorDays: 180n,
          aprBps: 200n,
          minDeposit: 100_000_000n,
          maxDeposit:
            10_000_000_000n,
          earlyWithdrawPenaltyBps:
            750n,
          enabled: true,
        },
      ),
    ).resolves.toBe(transaction)

    expect(createPlan).toHaveBeenCalledWith(
      180n,
      200n,
      100_000_000n,
      10_000_000_000n,
      750n,
      true,
    )
  })

  it('updates APR and toggles plans with exact IDs', async () => {
    const transaction =
      createTransaction()

    const updatePlan = vi.fn(
      async () => transaction,
    )

    const enablePlan = vi.fn(
      async () => transaction,
    )

    const disablePlan = vi.fn(
      async () => transaction,
    )

    const contract = {
      updatePlan,
      enablePlan,
      disablePlan,
    }

    await updateSavingPlanApr(
      contract,
      2n,
      725n,
    )

    await enableSavingPlan(
      contract,
      2n,
    )

    await disableSavingPlan(
      contract,
      3n,
    )

    expect(updatePlan).toHaveBeenCalledWith(
      2n,
      725n,
    )

    expect(enablePlan).toHaveBeenCalledWith(
      2n,
    )

    expect(disablePlan).toHaveBeenCalledWith(
      3n,
    )
  })

  it('funds, withdraws and updates fee receiver exactly', async () => {
    const transaction =
      createTransaction()

    const fundVault = vi.fn(
      async () => transaction,
    )

    const withdrawVault = vi.fn(
      async () => transaction,
    )

    const setFeeReceiver = vi.fn(
      async () => transaction,
    )

    const contract = {
      fundVault,
      withdrawVault,
      setFeeReceiver,
    }

    await fundInterestVault(
      contract,
      500_000_000n,
    )

    await withdrawInterestVault(
      contract,
      125_000_000n,
    )

    await updateVaultFeeReceiver(
      contract,
      FEE_RECEIVER.toLowerCase(),
    )

    expect(fundVault).toHaveBeenCalledWith(
      500_000_000n,
    )

    expect(
      withdrawVault,
    ).toHaveBeenCalledWith(
      125_000_000n,
    )

    expect(
      setFeeReceiver,
    ).toHaveBeenCalledWith(
      getAddress(FEE_RECEIVER),
    )
  })

  it('calls each pause action on its own contract', async () => {
    const transaction =
      createTransaction()

    const corePause = vi.fn(
      async () => transaction,
    )

    const coreUnpause = vi.fn(
      async () => transaction,
    )

    const vaultPause = vi.fn(
      async () => transaction,
    )

    const vaultUnpause = vi.fn(
      async () => transaction,
    )

    await pauseSavingCore({
      pause: corePause,
    })

    await unpauseSavingCore({
      unpause: coreUnpause,
    })

    await pauseVaultManager({
      pause: vaultPause,
    })

    await unpauseVaultManager({
      unpause: vaultUnpause,
    })

    expect(corePause).toHaveBeenCalledTimes(1)
    expect(coreUnpause).toHaveBeenCalledTimes(1)
    expect(vaultPause).toHaveBeenCalledTimes(1)
    expect(vaultUnpause).toHaveBeenCalledTimes(1)
  })

  it('rejects invalid financial and address inputs before contract calls', async () => {
    const createPlan = vi.fn()
    const approve = vi.fn()
    const setFeeReceiver = vi.fn()

    await expect(
      approveVaultManagerFunding(
        { approve },
        0n,
      ),
    ).rejects.toThrow(
      'approvalAmount must be a positive bigint.',
    )

    await expect(
      createSavingPlan(
        { createPlan },
        {
          tenorDays: 180n,
          aprBps: 200n,
          minDeposit: 200n,
          maxDeposit: 100n,
          earlyWithdrawPenaltyBps:
            750n,
          enabled: true,
        },
      ),
    ).rejects.toThrow(
      'maxDeposit must be greater than or equal to minDeposit.',
    )

    await expect(
      updateVaultFeeReceiver(
        { setFeeReceiver },
        '0x0000000000000000000000000000000000000000',
      ),
    ).rejects.toThrow(
      'feeReceiver must not be the zero address.',
    )

    expect(approve).not.toHaveBeenCalled()
    expect(createPlan).not.toHaveBeenCalled()
    expect(
      setFeeReceiver,
    ).not.toHaveBeenCalled()
  })
})