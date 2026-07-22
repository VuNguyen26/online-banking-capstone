import {
  ZeroAddress,
  getAddress,
} from 'ethers'

export type AdminAuthorization = {
  isSavingCoreOwner: boolean
  isVaultManagerOwner: boolean
  isSavingCorePendingOwner: boolean
  isVaultManagerPendingOwner: boolean
}

export type DeriveAdminAuthorizationArguments = {
  account: string | null
  savingCoreOwner: string
  savingCorePendingOwner: string
  vaultManagerOwner: string
  vaultManagerPendingOwner: string
}

function matchesPendingOwner(
  account: string,
  pendingOwner: string,
): boolean {
  const normalizedPendingOwner =
    getAddress(pendingOwner)

  return (
    normalizedPendingOwner !== ZeroAddress &&
    normalizedPendingOwner === account
  )
}

export function deriveAdminAuthorization({
  account,
  savingCoreOwner,
  savingCorePendingOwner,
  vaultManagerOwner,
  vaultManagerPendingOwner,
}: DeriveAdminAuthorizationArguments): AdminAuthorization {
  if (account === null) {
    return {
      isSavingCoreOwner: false,
      isVaultManagerOwner: false,
      isSavingCorePendingOwner: false,
      isVaultManagerPendingOwner: false,
    }
  }

  const normalizedAccount =
    getAddress(account)

  return {
    isSavingCoreOwner:
      normalizedAccount ===
      getAddress(savingCoreOwner),
    isVaultManagerOwner:
      normalizedAccount ===
      getAddress(vaultManagerOwner),
    isSavingCorePendingOwner:
      matchesPendingOwner(
        normalizedAccount,
        savingCorePendingOwner,
      ),
    isVaultManagerPendingOwner:
      matchesPendingOwner(
        normalizedAccount,
        vaultManagerPendingOwner,
      ),
  }
}