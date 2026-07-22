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
  readAdminConfiguration,
  readAdminDepositCount,
  readAdminTokenAccountState,
} from './adminRead'

const TOKEN =
  '0xcf779ec5d80573d3254054a17c5b4f0117491662'
const VAULT =
  '0xa79f660fab4ebae6ac4298034cb3fd6d28e5d2f7'
const CORE =
  '0xa35c55e7e2db5874699cc9fb8d0e25032f51b443'
const OWNER =
  '0xa998526b0a5f23680f50fa3677f5c6576dba89d9'

describe('admin configuration reads', () => {
  it('reads and normalizes both contract configurations', async () => {
    const result =
      await readAdminConfiguration(
        {
          owner: async () => OWNER,
          pendingOwner: async () => ZeroAddress,
          token: async () => TOKEN,
          vaultManager: async () => VAULT,
          paused: async () => false,
        },
        {
          owner: async () => OWNER,
          pendingOwner: async () => ZeroAddress,
          feeReceiver: async () => OWNER,
          token: async () => TOKEN,
          savingCore: async () => CORE,
          paused: async () => true,
        },
      )

    expect(result).toEqual({
      savingCoreOwner: getAddress(OWNER),
      savingCorePendingOwner: ZeroAddress,
      vaultManagerOwner: getAddress(OWNER),
      vaultManagerPendingOwner: ZeroAddress,
      feeReceiver: getAddress(OWNER),
      savingCoreToken: getAddress(TOKEN),
      savingCoreVaultManager:
        getAddress(VAULT),
      vaultManagerToken: getAddress(TOKEN),
      vaultManagerSavingCore:
        getAddress(CORE),
      savingCorePaused: false,
      vaultManagerPaused: true,
    })
  })

  it('rejects malformed contract responses', async () => {
    await expect(
      readAdminConfiguration(
        {
          owner: async () => 'invalid',
          pendingOwner: async () => ZeroAddress,
          token: async () => TOKEN,
          vaultManager: async () => VAULT,
          paused: async () => false,
        },
        {
          owner: async () => OWNER,
          pendingOwner: async () => ZeroAddress,
          feeReceiver: async () => OWNER,
          token: async () => TOKEN,
          savingCore: async () => CORE,
          paused: async () => false,
        },
      ),
    ).rejects.toThrow(
      'savingCoreOwner must be an address.',
    )
  })
})
describe('admin overview reads', () => {
  it('reads deposit count as an unsigned bigint', async () => {
    await expect(
      readAdminDepositCount({
        depositCount: async () => '7',
      }),
    ).resolves.toBe(7n)
  })

  it('rejects an invalid deposit count', async () => {
    await expect(
      readAdminDepositCount({
        depositCount: async () => -1n,
      }),
    ).rejects.toThrow(
      'depositCount must be an unsigned integer.',
    )
  })
})
describe('admin token account reads', () => {
  it('reads wallet balance and VaultManager allowance', async () => {
    const calls: unknown[][] = []

    const result =
      await readAdminTokenAccountState(
        {
          balanceOf: async (
            account: string,
          ) => {
            calls.push([
              'balanceOf',
              account,
            ])

            return '5000000'
          },
          allowance: async (
            owner: string,
            spender: string,
          ) => {
            calls.push([
              'allowance',
              owner,
              spender,
            ])

            return 2500000n
          },
        },
        OWNER.toLowerCase(),
        VAULT.toLowerCase(),
      )

    expect(result).toEqual({
      balance: 5000000n,
      vaultManagerAllowance: 2500000n,
    })

    expect(calls).toEqual([
      [
        'balanceOf',
        getAddress(OWNER),
      ],
      [
        'allowance',
        getAddress(OWNER),
        getAddress(VAULT),
      ],
    ])
  })

  it('rejects malformed token account values', async () => {
    await expect(
      readAdminTokenAccountState(
        {
          balanceOf: async () => 'invalid',
          allowance: async () => 0n,
        },
        OWNER,
        VAULT,
      ),
    ).rejects.toThrow(
      'adminTokenBalance must be an unsigned integer.',
    )
  })
})