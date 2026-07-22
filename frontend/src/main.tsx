import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import {
  SafeBankDataProvider,
} from './providers/SafeBankDataProvider'
import {
  WalletProvider,
} from './providers/WalletProvider'
import {
  LanguageProvider,
} from './i18n/LanguageProvider'

import './index.css'

createRoot(
  document.getElementById('root')!,
).render(
  <StrictMode>
    <LanguageProvider>
      <WalletProvider>
      <SafeBankDataProvider>
        <App />
      </SafeBankDataProvider>
      </WalletProvider>
    </LanguageProvider>
  </StrictMode>,
)
