import { useSafeBankData } from './hooks/useSafeBankData'
import { useWallet } from './hooks/useWallet'
import {
  UserDashboard,
} from './components/UserDashboard'

function App() {
  const wallet = useWallet()
  const safeBank = useSafeBankData()

  return (
    <UserDashboard
      wallet={wallet}
      safeBank={safeBank}
    />
  )
}

export default App
