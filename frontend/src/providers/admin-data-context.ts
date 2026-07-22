import { createContext } from 'react'

import type {
  AdminDashboardData,
} from '../contracts/adminDashboard'

export type AdminDataStatus =
  | 'loading'
  | 'ready'
  | 'error'

export type AdminDataContextValue = {
  status: AdminDataStatus
  data: AdminDashboardData | null
  error: string | null
  refresh: () => Promise<void>
}

export const AdminDataContext =
  createContext<AdminDataContextValue | null>(
    null,
  )