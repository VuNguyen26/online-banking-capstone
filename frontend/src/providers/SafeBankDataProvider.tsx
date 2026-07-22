import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {
  loadSafeBankDashboard,
  type DashboardContracts,
  type LoadSafeBankDashboardArguments,
  type SafeBankDashboardData,
} from '../contracts/dashboard'
import {
  createReadOnlyContracts,
} from '../contracts/client'
import { useWallet } from '../hooks/useWallet'
import {
  SafeBankDataContext,
  type SafeBankDataContextValue,
  type SafeBankDataStatus,
} from './safebank-data-context'

export type SafeBankReadClient = {
  provider: unknown
  contracts: DashboardContracts
}

export type SafeBankDashboardLoader = (
  arguments_: LoadSafeBankDashboardArguments,
) => Promise<SafeBankDashboardData>

const DEFAULT_READ_CLIENT =
  createReadOnlyContracts()

type SafeBankDataProviderProps = {
  children: ReactNode
  readClient?: SafeBankReadClient
  loader?: SafeBankDashboardLoader
}

function getReadErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error &&
    error.message.trim().length > 0
  ) {
    return error.message
  }

  return 'Unable to load SafeBank data from Ethereum Sepolia.'
}

export function SafeBankDataProvider({
  children,
  readClient,
  loader = loadSafeBankDashboard,
}: SafeBankDataProviderProps) {
  const { account } = useWallet()

  const client = useMemo<SafeBankReadClient>(
    () =>
      readClient ??
      DEFAULT_READ_CLIENT,
    [readClient],
  )

  const [status, setStatus] =
    useState<SafeBankDataStatus>('loading')
  const [data, setData] =
    useState<SafeBankDashboardData | null>(null)
  const [error, setError] =
    useState<string | null>(null)

  const requestId = useRef(0)

  const refresh = useCallback(async () => {
    const currentRequestId =
      requestId.current + 1

    requestId.current =
      currentRequestId

    setStatus('loading')
    setData(null)
    setError(null)

    try {
      const nextData = await loader({
        provider: client.provider,
        contracts: client.contracts,
        account,
      })

      if (
        requestId.current !==
        currentRequestId
      ) {
        return
      }

      setData(nextData)
      setStatus('ready')
    } catch (readError) {
      if (
        requestId.current !==
        currentRequestId
      ) {
        return
      }

      setData(null)
      setError(
        getReadErrorMessage(readError),
      )
      setStatus('error')
    }
  }, [account, client, loader])

  useEffect(() => {
    void refresh()

    return () => {
      requestId.current += 1
    }
  }, [refresh])


  const value =
    useMemo<SafeBankDataContextValue>(
      () => ({
        status,
        data,
        error,
        refresh,
      }),
      [
        status,
        data,
        error,
        refresh,
      ],
    )

  return (
    <SafeBankDataContext.Provider
      value={value}
    >
      {children}
    </SafeBankDataContext.Provider>
  )
}
