import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {
  loadAdminDashboard,
  type AdminDashboardContracts,
  type AdminDashboardData,
  type LoadAdminDashboardArguments,
} from '../contracts/adminDashboard'
import {
  createReadOnlyContracts,
} from '../contracts/client'
import { useWallet } from '../hooks/useWallet'
import {
  AdminDataContext,
  type AdminDataContextValue,
  type AdminDataStatus,
} from './admin-data-context'

export type AdminReadClient = {
  contracts: AdminDashboardContracts
}

export type AdminDashboardLoader = (
  arguments_: LoadAdminDashboardArguments,
) => Promise<AdminDashboardData>

const DEFAULT_READ_CLIENT: AdminReadClient =
  createReadOnlyContracts()

type AdminDataProviderProps = {
  children: ReactNode
  readClient?: AdminReadClient
  loader?: AdminDashboardLoader
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

  return 'Unable to load SafeBank admin data.'
}

export function AdminDataProvider({
  children,
  readClient,
  loader = loadAdminDashboard,
}: AdminDataProviderProps) {
  const { account } = useWallet()

  const client = useMemo<AdminReadClient>(
    () =>
      readClient ??
      DEFAULT_READ_CLIENT,
    [readClient],
  )

  const [status, setStatus] =
    useState<AdminDataStatus>('loading')

  const [data, setData] =
    useState<AdminDashboardData | null>(
      null,
    )

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
  }, [
    account,
    client.contracts,
    loader,
  ])

  useEffect(() => {
    void refresh()

    return () => {
      requestId.current += 1
    }
  }, [refresh])

  const value =
    useMemo<AdminDataContextValue>(
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
    <AdminDataContext.Provider
      value={value}
    >
      {children}
    </AdminDataContext.Provider>
  )
}