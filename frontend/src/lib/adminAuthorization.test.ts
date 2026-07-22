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
  deriveAdminAuthorization,
} from './adminAuthorization'

const ACCOUNT =
  '0xa998526b0a5f23680f50fa3677f5c6576dba89d9'

const OTHER_ACCOUNT =
  '0x1111111111111111111111111111111111111111'

const THIRD_ACCOUNT =
  '0x2222222222222222222222222222222222222222'

describe('admin authorization', () => {
  it('returns no authority while the wallet is disconnected', () => {
    expect(
      deriveAdminAuthorization({
        account: null,
        savingCoreOwner: ACCOUNT,
        savingCorePendingOwner:
          OTHER_ACCOUNT,
        vaultManagerOwner: ACCOUNT,
        vaultManagerPendingOwner:
          THIRD_ACCOUNT,
      }),
    ).toEqual({
      isSavingCoreOwner: false,
      isVaultManagerOwner: false,
      isSavingCorePendingOwner: false,
      isVaultManagerPendingOwner: false,
    })
  })

  it('derives contract ownership independently using normalized addresses', () => {
    expect(
      deriveAdminAuthorization({
        account: ACCOUNT,
        savingCoreOwner:
          getAddress(ACCOUNT),
        savingCorePendingOwner:
          ZeroAddress,
        vaultManagerOwner:
          OTHER_ACCOUNT,
        vaultManagerPendingOwner:
          ZeroAddress,
      }),
    ).toEqual({
      isSavingCoreOwner: true,
      isVaultManagerOwner: false,
      isSavingCorePendingOwner: false,
      isVaultManagerPendingOwner: false,
    })
  })

  it('recognizes nonzero pending ownership independently', () => {
    expect(
      deriveAdminAuthorization({
        account: ACCOUNT,
        savingCoreOwner:
          OTHER_ACCOUNT,
        savingCorePendingOwner:
          ACCOUNT,
        vaultManagerOwner:
          THIRD_ACCOUNT,
        vaultManagerPendingOwner:
          ZeroAddress,
      }),
    ).toEqual({
      isSavingCoreOwner: false,
      isVaultManagerOwner: false,
      isSavingCorePendingOwner: true,
      isVaultManagerPendingOwner: false,
    })
  })
})