import { useContext } from 'react'

import {
  SafeBankDataContext,
} from '../providers/safebank-data-context'

export function useSafeBankData() {
  const context =
    useContext(SafeBankDataContext)

  if (!context) {
    throw new Error(
      'useSafeBankData must be used within SafeBankDataProvider.',
    )
  }

  return context
}
