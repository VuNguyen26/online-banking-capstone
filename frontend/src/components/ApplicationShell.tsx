import type {
  ReactNode,
} from 'react'

import {
  useLanguage,
} from '../i18n/useLanguage'
import {
  LanguageSwitcher,
} from './LanguageSwitcher'

import './UserDashboard.css'

export type ApplicationView =
  | 'user'
  | 'admin'

type ApplicationShellProps = {
  children: ReactNode
  activeView?: ApplicationView
  onViewChange?: (
    view: ApplicationView,
  ) => void
}

export function ApplicationShell({
  children,
  activeView,
  onViewChange,
}: ApplicationShellProps) {
  const { t } = useLanguage()

  const heroTitle =
    activeView === 'admin'
      ? t('adminHeroTitle')
      : t('heroTitle')

  const heroDescription =
    activeView === 'admin'
      ? t('adminHeroDescription')
      : t('heroDescription')

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="brand-mark">
            SafeBank
          </p>

          <h1>{heroTitle}</h1>

          <p className="hero-copy">
            {heroDescription}
          </p>
        </div>

        <div className="hero-actions">
          <LanguageSwitcher />

          <div className="network-chip">
            <span className="network-dot" />
            Ethereum Sepolia
          </div>
        </div>
      </header>

      {activeView && onViewChange ? (
        <nav
          className="application-navigation"
          aria-label={t(
            'applicationNavigation',
          )}
        >
          <button
            type="button"
            aria-current={
              activeView === 'user'
                ? 'page'
                : undefined
            }
            onClick={() =>
              onViewChange('user')
            }
          >
            {t('userPortal')}
          </button>

          <button
            type="button"
            aria-current={
              activeView === 'admin'
                ? 'page'
                : undefined
            }
            onClick={() =>
              onViewChange('admin')
            }
          >
            {t('adminPortal')}
          </button>
        </nav>
      ) : null}

      <aside
        className="testnet-notice"
        aria-label="Testnet notice"
      >
        <strong>
          {t('testnetTitle')}
        </strong>

        <span>
          {t('testnetDescription')}
        </span>
      </aside>

      {children}
    </main>
  )
}