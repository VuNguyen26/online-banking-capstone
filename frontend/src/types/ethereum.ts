import type { Eip1193Provider } from 'ethers'

export type EthereumRequestArguments = {
  method: string
  params?: readonly unknown[] | object
}

export type EthereumEventListener = (
  value: unknown,
) => void

export interface BrowserEthereumProvider
  extends Eip1193Provider {
  isMetaMask?: boolean

  request(
    arguments_: EthereumRequestArguments,
  ): Promise<unknown>

  on?(
    eventName: 'accountsChanged' | 'chainChanged',
    listener: EthereumEventListener,
  ): void

  removeListener?(
    eventName: 'accountsChanged' | 'chainChanged',
    listener: EthereumEventListener,
  ): void
}

declare global {
  interface Window {
    ethereum?: BrowserEthereumProvider
  }
}
