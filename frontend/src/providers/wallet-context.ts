import { createContext } from 'react'
import type { JsonRpcSigner } from 'ethers'

export type WalletStatus =
  | 'checking'
  | 'unavailable'
  | 'disconnected'
  | 'connected'

export type WalletContextValue = {
  status: WalletStatus
  walletAvailable: boolean
  account: string | null
  chainId: bigint | null
  isConnected: boolean
  isSepolia: boolean
  isConnecting: boolean
  isSwitchingNetwork: boolean
  error: string | null
  connectWallet: () => Promise<void>
  switchToSepolia: () => Promise<void>
  getSigner: () => Promise<JsonRpcSigner>
  clearError: () => void
}

export const WalletContext =
  createContext<WalletContextValue | null>(null)
