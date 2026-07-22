import {
  useAdminData,
} from '../hooks/useAdminData'
import {
  useLanguage,
} from '../i18n/useLanguage'
import {
  formatMusdcAmount,
} from '../lib/units'
import type {
  WalletContextValue,
} from '../providers/wallet-context'
import {
  ApplicationShell,
  type ApplicationView,
} from './ApplicationShell'
import {
  AdminConfigurationPanel,
} from './AdminConfigurationPanel'
import {
  AdminDepositInspectionPanel,
} from './AdminDepositInspectionPanel'
import {
  AdminVaultPanel,
} from './AdminVaultPanel'
import {
  AdminPlansPanel,
} from './AdminPlansPanel'

import './AdminDashboard.css'

type AdminDashboardProps = {
  wallet: WalletContextValue
  onViewChange: (
    view: ApplicationView,
  ) => void
}

export function AdminDashboard({
  wallet,
  onViewChange,
}: AdminDashboardProps) {
  const admin = useAdminData()
  const { t } = useLanguage()

  return (
    <ApplicationShell
      activeView="admin"
      onViewChange={onViewChange}
    >
      <section
        className="panel admin-overview"
        aria-labelledby="admin-overview-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {t('adminPortal')}
            </p>

            <h2 id="admin-overview-heading">
              {t('adminPortal')}
            </h2>

            <p>
              {t(
                'adminOverviewDescription',
              )}
            </p>
          </div>
        </div>

        {admin.status === 'loading' ? (
          <p role="status">
            {t('adminLoading')}
          </p>
        ) : null}

        {admin.status === 'error' ? (
          <div
            className="error-message"
            role="alert"
          >
            <p>
              {admin.error ??
                t('adminLoadError')}
            </p>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                void admin.refresh()
              }}
            >
              {t('adminRetry')}
            </button>
          </div>
        ) : null}

        {admin.status === 'ready' &&
        admin.data ? (
          <>
            <div className="admin-summary-grid">
              <article className="admin-summary-card">
                <span>
                  {t('adminPlanCount')}
                </span>

                <output
                  data-testid="admin-plan-count"
                >
                  {admin.data.plans.length}
                </output>
              </article>

              <article className="admin-summary-card">
                <span>
                  {t('adminDepositCount')}
                </span>

                <output
                  data-testid="admin-deposit-count"
                >
                  {admin.data.depositCount.toString()}
                </output>
              </article>

              <article className="admin-summary-card">
                <span>
                  {t('adminVaultBalance')}
                </span>

                <output
                  data-testid="admin-vault-balance"
                >
                  {formatMusdcAmount(
                    admin.data.vaultMetrics
                      .vaultBalance,
                  )}{' '}
                  mUSDC
                </output>
              </article>
            </div>

            <AdminConfigurationPanel
              data={admin.data}
              wallet={wallet}
              refresh={admin.refresh}
            />

            <AdminPlansPanel
              data={admin.data}
              wallet={wallet}
              refresh={admin.refresh}
            />

            <AdminVaultPanel
              data={admin.data}
              wallet={wallet}
              refresh={admin.refresh}
            />

            <AdminDepositInspectionPanel />
          </>
        ) : null}
      </section>
    </ApplicationShell>
  )
}