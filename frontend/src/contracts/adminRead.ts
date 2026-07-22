import { getAddress } from 'ethers'

export type AdminConfiguration = {
  savingCoreOwner: string
  savingCorePendingOwner: string
  vaultManagerOwner: string
  vaultManagerPendingOwner: string
  feeReceiver: string
  savingCoreToken: string
  savingCoreVaultManager: string
  vaultManagerToken: string
  vaultManagerSavingCore: string
  savingCorePaused: boolean
  vaultManagerPaused: boolean
}

type SavingCoreAdminReadContract = {
  owner: () => Promise<unknown>
  pendingOwner: () => Promise<unknown>
  token: () => Promise<unknown>
  vaultManager: () => Promise<unknown>
  paused: () => Promise<unknown>
}

type VaultManagerAdminReadContract = {
  owner: () => Promise<unknown>
  pendingOwner: () => Promise<unknown>
  feeReceiver: () => Promise<unknown>
  token: () => Promise<unknown>
  savingCore: () => Promise<unknown>
  paused: () => Promise<unknown>
}

function requireAddress(
  value: unknown,
  fieldName: string,
): string {
  if (typeof value !== 'string') {
    throw new Error(
      `${fieldName} must be an address.`,
    )
  }

  try {
    return getAddress(value)
  } catch {
    throw new Error(
      `${fieldName} must be an address.`,
    )
  }
}

function requireBoolean(
  value: unknown,
  fieldName: string,
): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(
      `${fieldName} must be a boolean.`,
    )
  }

  return value
}

export async function readAdminConfiguration(
  savingCore: unknown,
  vaultManager: unknown,
): Promise<AdminConfiguration> {
  const core =
    savingCore as SavingCoreAdminReadContract

  const vault =
    vaultManager as VaultManagerAdminReadContract

  const [
    savingCoreOwner,
    savingCorePendingOwner,
    savingCoreToken,
    savingCoreVaultManager,
    savingCorePaused,
    vaultManagerOwner,
    vaultManagerPendingOwner,
    feeReceiver,
    vaultManagerToken,
    vaultManagerSavingCore,
    vaultManagerPaused,
  ] = await Promise.all([
    core.owner(),
    core.pendingOwner(),
    core.token(),
    core.vaultManager(),
    core.paused(),
    vault.owner(),
    vault.pendingOwner(),
    vault.feeReceiver(),
    vault.token(),
    vault.savingCore(),
    vault.paused(),
  ])

  return {
    savingCoreOwner: requireAddress(
      savingCoreOwner,
      'savingCoreOwner',
    ),
    savingCorePendingOwner: requireAddress(
      savingCorePendingOwner,
      'savingCorePendingOwner',
    ),
    vaultManagerOwner: requireAddress(
      vaultManagerOwner,
      'vaultManagerOwner',
    ),
    vaultManagerPendingOwner: requireAddress(
      vaultManagerPendingOwner,
      'vaultManagerPendingOwner',
    ),
    feeReceiver: requireAddress(
      feeReceiver,
      'feeReceiver',
    ),
    savingCoreToken: requireAddress(
      savingCoreToken,
      'savingCoreToken',
    ),
    savingCoreVaultManager: requireAddress(
      savingCoreVaultManager,
      'savingCoreVaultManager',
    ),
    vaultManagerToken: requireAddress(
      vaultManagerToken,
      'vaultManagerToken',
    ),
    vaultManagerSavingCore: requireAddress(
      vaultManagerSavingCore,
      'vaultManagerSavingCore',
    ),
    savingCorePaused: requireBoolean(
      savingCorePaused,
      'savingCorePaused',
    ),
    vaultManagerPaused: requireBoolean(
      vaultManagerPaused,
      'vaultManagerPaused',
    ),
  }
}
type SavingCoreAdminCounterContract = {
  depositCount: () => Promise<unknown>
}

function requireUnsignedBigInt(
  value: unknown,
  fieldName: string,
): bigint {
  let normalizedValue: bigint

  if (typeof value === 'bigint') {
    normalizedValue = value
  } else if (
    typeof value === 'number' &&
    Number.isSafeInteger(value)
  ) {
    normalizedValue = BigInt(value)
  } else if (
    typeof value === 'string' &&
    /^\d+$/.test(value)
  ) {
    normalizedValue = BigInt(value)
  } else {
    throw new Error(
      `${fieldName} must be an unsigned integer.`,
    )
  }

  if (normalizedValue < 0n) {
    throw new Error(
      `${fieldName} must be an unsigned integer.`,
    )
  }

  return normalizedValue
}

export async function readAdminDepositCount(
  savingCore: unknown,
): Promise<bigint> {
  const contract =
    savingCore as SavingCoreAdminCounterContract

  return requireUnsignedBigInt(
    await contract.depositCount(),
    'depositCount',
  )
}
export type AdminTokenAccountState = {
  balance: bigint
  vaultManagerAllowance: bigint
}

type MockUsdcAdminReadContract = {
  balanceOf: (
    account: string,
  ) => Promise<unknown>

  allowance: (
    owner: string,
    spender: string,
  ) => Promise<unknown>
}

export async function readAdminTokenAccountState(
  mockUsdc: unknown,
  account: string,
  vaultManagerAddress: string,
): Promise<AdminTokenAccountState> {
  const contract =
    mockUsdc as MockUsdcAdminReadContract

  const normalizedAccount =
    getAddress(account)

  const normalizedVaultManager =
    getAddress(vaultManagerAddress)

  const [
    balance,
    vaultManagerAllowance,
  ] = await Promise.all([
    contract.balanceOf(
      normalizedAccount,
    ),
    contract.allowance(
      normalizedAccount,
      normalizedVaultManager,
    ),
  ])

  return {
    balance: requireUnsignedBigInt(
      balance,
      'adminTokenBalance',
    ),
    vaultManagerAllowance:
      requireUnsignedBigInt(
        vaultManagerAllowance,
        'vaultManagerAllowance',
      ),
  }
}