import { createContext } from 'react'

import type {
  SafeBankDashboardData,
} from '../contracts/dashboard'

export type SafeBankDataStatus =
  | 'loading'
  | 'ready'
  | 'error'

export type SafeBankDataContextValue = {
  status: SafeBankDataStatus
  data: SafeBankDashboardData | null
  error: string | null
  refresh: () => Promise<void>
}

export const SafeBankDataContext =
  createContext<SafeBankDataContextValue | null>(
    null,
  )
