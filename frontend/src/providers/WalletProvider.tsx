import {
  BrowserProvider,
  type JsonRpcSigner,
} from 'ethers'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  SEPOLIA_WALLET_PARAMETERS,
} from '../config/network'
import {
  isSepoliaChain,
  isUnknownChainError,
  isUserRejectedRequest,
  normalizeWalletAccounts,
  parseWalletChainId,
} from '../lib/wallet'
import type {
  BrowserEthereumProvider,
  EthereumEventListener,
} from '../types/ethereum'
import {
  WalletContext,
  type WalletContextValue,
  type WalletStatus,
} from './wallet-context'

type WalletProviderProps = {
  children: ReactNode
}

function getWalletErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (isUserRejectedRequest(error)) {
    return 'The request was rejected in your wallet.'
  }

  if (
    error instanceof Error &&
    error.message.trim().length > 0
  ) {
    return error.message
  }

  return fallbackMessage
}

export function WalletProvider({
  children,
}: WalletProviderProps) {
  const [isInitialized, setIsInitialized] =
    useState(false)
  const [walletAvailable, setWalletAvailable] =
    useState(false)
  const [account, setAccount] =
    useState<string | null>(null)
  const [chainId, setChainId] =
    useState<bigint | null>(null)
  const [isConnecting, setIsConnecting] =
    useState(false)
  const [
    isSwitchingNetwork,
    setIsSwitchingNetwork,
  ] = useState(false)
  const [error, setError] =
    useState<string | null>(null)

  const applyAccounts = useCallback(
    (value: unknown) => {
      const accounts = normalizeWalletAccounts(value)

      setAccount(accounts[0] ?? null)
    },
    [],
  )

  const applyChainId = useCallback(
    (value: unknown) => {
      setChainId(parseWalletChainId(value))
    },
    [],
  )

  useEffect(() => {
    const ethereum = window.ethereum

    if (!ethereum) {
      setWalletAvailable(false)
      setIsInitialized(true)

      return
    }

    let isActive = true

    setWalletAvailable(true)

    const initializeWallet = async () => {
      try {
        const [accounts, currentChainId] =
          await Promise.all([
            ethereum.request({
              method: 'eth_accounts',
            }),
            ethereum.request({
              method: 'eth_chainId',
            }),
          ])

        if (!isActive) {
          return
        }

        applyAccounts(accounts)
        applyChainId(currentChainId)
      } catch (initializationError) {
        if (!isActive) {
          return
        }

        setError(
          getWalletErrorMessage(
            initializationError,
            'Unable to read the browser wallet state.',
          ),
        )
      } finally {
        if (isActive) {
          setIsInitialized(true)
        }
      }
    }

    const handleAccountsChanged:
      EthereumEventListener = (value) => {
        applyAccounts(value)
        setError(null)
      }

    const handleChainChanged:
      EthereumEventListener = (value) => {
        applyChainId(value)
        setError(null)
      }

    ethereum.on?.(
      'accountsChanged',
      handleAccountsChanged,
    )

    ethereum.on?.(
      'chainChanged',
      handleChainChanged,
    )

    void initializeWallet()

    return () => {
      isActive = false

      ethereum.removeListener?.(
        'accountsChanged',
        handleAccountsChanged,
      )

      ethereum.removeListener?.(
        'chainChanged',
        handleChainChanged,
      )
    }
  }, [applyAccounts, applyChainId])

  const connectWallet = useCallback(async () => {
    const ethereum = window.ethereum

    if (!ethereum) {
      setWalletAvailable(false)
      setError(
        'No EIP-1193 browser wallet was detected.',
      )

      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      })

      const currentChainId = await ethereum.request({
        method: 'eth_chainId',
      })

      applyAccounts(accounts)
      applyChainId(currentChainId)
    } catch (connectionError) {
      setError(
        getWalletErrorMessage(
          connectionError,
          'Unable to connect the browser wallet.',
        ),
      )
    } finally {
      setIsConnecting(false)
    }
  }, [applyAccounts, applyChainId])

  const switchToSepolia =
    useCallback(async () => {
      const ethereum = window.ethereum

      if (!ethereum) {
        setWalletAvailable(false)
        setError(
          'No EIP-1193 browser wallet was detected.',
        )

        return
      }

      setIsSwitchingNetwork(true)
      setError(null)

      try {
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [
              {
                chainId:
                  SEPOLIA_WALLET_PARAMETERS.chainId,
              },
            ],
          })
        } catch (switchError) {
          if (!isUnknownChainError(switchError)) {
            throw switchError
          }

          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              SEPOLIA_WALLET_PARAMETERS,
            ],
          })
        }

        const currentChainId =
          await ethereum.request({
            method: 'eth_chainId',
          })

        applyChainId(currentChainId)
      } catch (networkError) {
        setError(
          getWalletErrorMessage(
            networkError,
            'Unable to switch to Ethereum Sepolia.',
          ),
        )
      } finally {
        setIsSwitchingNetwork(false)
      }
    }, [applyChainId])

  const getSigner =
    useCallback(async (): Promise<JsonRpcSigner> => {
      const ethereum:
        BrowserEthereumProvider | undefined =
        window.ethereum

      if (!ethereum) {
        throw new Error(
          'No EIP-1193 browser wallet was detected.',
        )
      }

      if (!account) {
        throw new Error(
          'Connect your wallet before sending a transaction.',
        )
      }

      if (!isSepoliaChain(chainId)) {
        throw new Error(
          'Switch your wallet to Ethereum Sepolia before sending a transaction.',
        )
      }

      const browserProvider =
        new BrowserProvider(ethereum)

      return browserProvider.getSigner(account)
    }, [account, chainId])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const isConnected = account !== null
  const isSepolia = isSepoliaChain(chainId)

  let status: WalletStatus = 'checking'

  if (isInitialized) {
    if (!walletAvailable) {
      status = 'unavailable'
    } else if (isConnected) {
      status = 'connected'
    } else {
      status = 'disconnected'
    }
  }

  const value = useMemo<WalletContextValue>(
    () => ({
      status,
      walletAvailable,
      account,
      chainId,
      isConnected,
      isSepolia,
      isConnecting,
      isSwitchingNetwork,
      error,
      connectWallet,
      switchToSepolia,
      getSigner,
      clearError,
    }),
    [
      status,
      walletAvailable,
      account,
      chainId,
      isConnected,
      isSepolia,
      isConnecting,
      isSwitchingNetwork,
      error,
      connectWallet,
      switchToSepolia,
      getSigner,
      clearError,
    ],
  )

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}
