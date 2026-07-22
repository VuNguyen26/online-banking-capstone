import {
  useState,
} from 'react'

import {
  AdminDashboard,
} from './components/AdminDashboard'
import type {
  ApplicationView,
} from './components/ApplicationShell'
import {
  UserDashboard,
} from './components/UserDashboard'
import { useSafeBankData } from './hooks/useSafeBankData'
import { useWallet } from './hooks/useWallet'
import {
  AdminDataProvider,
} from './providers/AdminDataProvider'

function App() {
  const wallet = useWallet()
  const safeBank = useSafeBankData()

  const [
    activeView,
    setActiveView,
  ] = useState<ApplicationView>('user')

  if (activeView === 'admin') {
    return (
      <AdminDataProvider>
        <AdminDashboard
          wallet={wallet}
          onViewChange={setActiveView}
        />
      </AdminDataProvider>
    )
  }

  return (
    <UserDashboard
      wallet={wallet}
      safeBank={safeBank}
      activeView="user"
      onViewChange={setActiveView}
    />
  )
}

export default App