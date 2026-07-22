import { getAddress } from 'ethers'

import { SEPOLIA_CHAIN_ID } from '../config/network'

export const USER_REJECTED_REQUEST_CODE = 4001
export const UNKNOWN_CHAIN_CODE = 4902

export type ProviderRpcErrorLike = {
  code?: unknown
  message?: unknown
}

export function normalizeWalletAccounts(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  const accounts: string[] = []

  for (const account of value) {
    if (typeof account !== 'string') {
      continue
    }

    try {
      accounts.push(getAddress(account))
    } catch {
      // Ignore malformed accounts returned by a wallet provider.
    }
  }

  return accounts
}

export function parseWalletChainId(
  value: unknown,
): bigint | null {
  if (typeof value !== 'string') {
    return null
  }

  try {
    const chainId = BigInt(value)

    return chainId >= 0n ? chainId : null
  } catch {
    return null
  }
}

export function isSepoliaChain(
  chainId: bigint | null,
): boolean {
  return chainId === SEPOLIA_CHAIN_ID
}

export function shortenAddress(
  address: string,
): string {
  const normalizedAddress = getAddress(address)

  return (
    `${normalizedAddress.slice(0, 6)}` +
    `…${normalizedAddress.slice(-4)}`
  )
}

export function getProviderErrorCode(
  error: unknown,
): number | null {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('code' in error)
  ) {
    return null
  }

  const code = (error as ProviderRpcErrorLike).code

  return typeof code === 'number' ? code : null
}

export function isUserRejectedRequest(
  error: unknown,
): boolean {
  return (
    getProviderErrorCode(error) ===
    USER_REJECTED_REQUEST_CODE
  )
}

export function isUnknownChainError(
  error: unknown,
): boolean {
  return getProviderErrorCode(error) === UNKNOWN_CHAIN_CODE
}
