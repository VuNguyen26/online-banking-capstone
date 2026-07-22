import { SAFE_BANK_DEPLOYMENT } from '../contracts/generated/contracts'

export const SEPOLIA_CHAIN_ID = 11_155_111n
export const SEPOLIA_CHAIN_ID_NUMBER = 11_155_111
export const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7'

export const SEPOLIA_NETWORK_NAME = 'Ethereum Sepolia'
export const SEPOLIA_CURRENCY_SYMBOL = 'ETH'

export const SEPOLIA_PUBLIC_RPC_URL =
  'https://ethereum-sepolia-rpc.publicnode.com'

export const SEPOLIA_EXPLORER_URL =
  'https://sepolia.etherscan.io'

export const SEPOLIA_WALLET_PARAMETERS = {
  chainId: SEPOLIA_CHAIN_ID_HEX,
  chainName: SEPOLIA_NETWORK_NAME,
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: SEPOLIA_CURRENCY_SYMBOL,
    decimals: 18,
  },
  rpcUrls: [SEPOLIA_PUBLIC_RPC_URL],
  blockExplorerUrls: [SEPOLIA_EXPLORER_URL],
} as const

if (
  SAFE_BANK_DEPLOYMENT.chainId !==
  SEPOLIA_CHAIN_ID_NUMBER
) {
  throw new Error(
    'SafeBank deployment metadata does not target Ethereum Sepolia.',
  )
}

export function getAddressExplorerUrl(
  address: string,
): string {
  return `${SEPOLIA_EXPLORER_URL}/address/${address}`
}

export function getTransactionExplorerUrl(
  transactionHash: string,
): string {
  return `${SEPOLIA_EXPLORER_URL}/tx/${transactionHash}`
}
