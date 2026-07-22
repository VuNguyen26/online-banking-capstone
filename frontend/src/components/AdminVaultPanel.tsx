import type {
  AdminDashboardData,
} from '../contracts/adminDashboard'
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
  AdminVaultFundingAction,
} from './AdminVaultFundingAction'
import {
  AdminVaultWithdrawAction,
} from './AdminVaultWithdrawAction'

type AdminVaultPanelProps = {
  data: AdminDashboardData
  wallet?: WalletContextValue
  refresh?: () => Promise<void>
}

function formatAmount(
  value: bigint,
): string {
  return `${formatMusdcAmount(value)} mUSDC`
}

export function AdminVaultPanel({
  data,
  wallet,
  refresh,
}: AdminVaultPanelProps) {
  const { t } = useLanguage()

  const {
    vaultMetrics,
    tokenAccountState,
  } = data

  const isUnderfunded =
    vaultMetrics.fundingShortfall > 0n

  return (
    <section
      className="panel admin-vault-panel"
      aria-labelledby="admin-vault-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {t('adminVaultEyebrow')}
          </p>

          <h2 id="admin-vault-heading">
            {t('adminVaultHeading')}
          </h2>

          <p>
            {t('adminVaultDescription')}
          </p>
        </div>

        <span
          className={
            isUnderfunded
              ? 'admin-status-badge admin-status-error'
              : 'admin-status-badge admin-status-ok'
          }
        >
          {isUnderfunded
            ? t('adminVaultUnderfunded')
            : t('adminVaultHealthy')}
        </span>
      </div>

      {isUnderfunded ? (
        <div
          className="warning-message"
          role="alert"
        >
          {t('adminVaultUnderfundedWarning')}
        </div>
      ) : null}

      <div className="admin-vault-metrics-grid">
        <article className="admin-summary-card">
          <span>
            {t('adminVaultBalance')}
          </span>

          <output data-testid="vault-balance">
            {formatAmount(
              vaultMetrics.vaultBalance,
            )}
          </output>
        </article>

        <article className="admin-summary-card">
          <span>
            {t('adminReservedInterest')}
          </span>

          <output data-testid="vault-reserved">
            {formatAmount(
              vaultMetrics.totalReservedInterest,
            )}
          </output>
        </article>

        <article className="admin-summary-card">
          <span>
            {t('adminAvailableLiquidity')}
          </span>

          <output data-testid="vault-available">
            {formatAmount(
              vaultMetrics.availableLiquidity,
            )}
          </output>
        </article>

        <article className="admin-summary-card">
          <span>
            {t('adminFundingShortfall')}
          </span>

          <output data-testid="vault-shortfall">
            {formatAmount(
              vaultMetrics.fundingShortfall,
            )}
          </output>
        </article>
      </div>

      <div className="admin-wallet-liquidity">
        <h3>
          {t('adminConnectedWalletLiquidity')}
        </h3>

        {tokenAccountState === null ? (
          <p data-testid="admin-wallet-balance">
            {t('adminWalletDisconnected')}
          </p>
        ) : (
          <dl className="admin-detail-list">
            <div>
              <dt>
                {t('adminWalletBalance')}
              </dt>

              <dd data-testid="admin-wallet-balance">
                {formatAmount(
                  tokenAccountState.balance,
                )}
              </dd>
            </div>

            <div>
              <dt>
                {t('adminVaultAllowance')}
              </dt>

              <dd data-testid="admin-vault-allowance">
                {formatAmount(
                  tokenAccountState
                    .vaultManagerAllowance,
                )}
              </dd>
            </div>
          </dl>
        )}
      </div>

      {wallet && refresh ? (
        <div className="admin-vault-actions">
          <AdminVaultFundingAction
            wallet={wallet}
            isVaultManagerOwner={
              data.authorization
                .isVaultManagerOwner
            }
            tokenBalance={
              tokenAccountState?.balance ??
              null
            }
            vaultAllowance={
              tokenAccountState
                ?.vaultManagerAllowance ??
              null
            }
            refresh={refresh}
          />

          <AdminVaultWithdrawAction
            wallet={wallet}
            isVaultManagerOwner={
              data.authorization
                .isVaultManagerOwner
            }
            vaultPaused={
              data.configuration
                .vaultManagerPaused
            }
            availableLiquidity={
              vaultMetrics.availableLiquidity
            }
            refresh={refresh}
          />
        </div>
      ) : null}
    </section>
  )
}