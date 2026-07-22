import {
  ZeroAddress,
} from 'ethers'

import type {
  AdminDashboardData,
} from '../contracts/adminDashboard'
import {
  useLanguage,
} from '../i18n/useLanguage'
import type {
  WalletContextValue,
} from '../providers/wallet-context'
import {
  AdminFeeReceiverAction,
} from './AdminFeeReceiverAction'
import {
  AdminProtocolPauseAction,
} from './AdminProtocolPauseAction'
import {
  deriveAdminConfigurationHealth,
} from '../lib/adminConfigurationHealth'
import {
  shortenAddress,
} from '../lib/wallet'

type AdminConfigurationPanelProps = {
  data: AdminDashboardData
  wallet?: WalletContextValue
  refresh?: () => Promise<void>
}

function formatPendingOwner(
  address: string,
  emptyLabel: string,
): string {
  return address === ZeroAddress
    ? emptyLabel
    : shortenAddress(address)
}

export function AdminConfigurationPanel({
  data,
  wallet,
  refresh,
}: AdminConfigurationPanelProps) {
  const { t } = useLanguage()

  const {
    configuration,
    authorization,
  } = data

  const health =
    deriveAdminConfigurationHealth(
      configuration,
    )

  const relationshipStatus = (
    matches: boolean,
  ) => (
    <span
      className={
        matches
          ? 'admin-status-badge admin-status-ok'
          : 'admin-status-badge admin-status-error'
      }
    >
      {matches
        ? t('adminRelationshipMatched')
        : t('adminRelationshipMismatch')}
    </span>
  )

  return (
    <section
      className="panel admin-configuration-panel"
      aria-labelledby="admin-configuration-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {t('adminConfigurationEyebrow')}
          </p>

          <h2 id="admin-configuration-heading">
            {t('adminConfigurationHeading')}
          </h2>

          <p>
            {t(
              'adminConfigurationDescription',
            )}
          </p>
        </div>
      </div>

      {!health.allRelationshipsValid ? (
        <div
          className="error-message"
          role="alert"
        >
          {t('adminConfigurationWarning')}
        </div>
      ) : null}

      <div className="admin-contract-grid">
        <article className="admin-contract-card">
          <div className="admin-contract-title">
            <h3>SavingCore</h3>

            <span
              className={
                configuration.savingCorePaused
                  ? 'admin-status-badge admin-status-error'
                  : 'admin-status-badge admin-status-ok'
              }
            >
              {configuration.savingCorePaused
                ? t('adminPaused')
                : t('adminActive')}
            </span>
          </div>

          <dl className="admin-detail-list">
            <div>
              <dt>{t('adminOwner')}</dt>
              <dd title={configuration.savingCoreOwner}>
                {shortenAddress(
                  configuration.savingCoreOwner,
                )}
              </dd>
            </div>

            <div>
              <dt>
                {t('adminPendingOwner')}
              </dt>
              <dd>
                {formatPendingOwner(
                  configuration.savingCorePendingOwner,
                  t('adminNone'),
                )}
              </dd>
            </div>

            <div>
              <dt>
                {t('adminConnectedWalletRole')}
              </dt>
              <dd
                data-testid="saving-core-owner-access"
              >
                {authorization.isSavingCoreOwner
                  ? t('adminOwnerAccess')
                  : t('adminReadOnlyAccess')}
              </dd>
            </div>
          </dl>
        </article>

        <article className="admin-contract-card">
          <div className="admin-contract-title">
            <h3>VaultManager</h3>

            <span
              className={
                configuration.vaultManagerPaused
                  ? 'admin-status-badge admin-status-error'
                  : 'admin-status-badge admin-status-ok'
              }
            >
              {configuration.vaultManagerPaused
                ? t('adminPaused')
                : t('adminActive')}
            </span>
          </div>

          <dl className="admin-detail-list">
            <div>
              <dt>{t('adminOwner')}</dt>
              <dd title={configuration.vaultManagerOwner}>
                {shortenAddress(
                  configuration.vaultManagerOwner,
                )}
              </dd>
            </div>

            <div>
              <dt>
                {t('adminPendingOwner')}
              </dt>
              <dd>
                {formatPendingOwner(
                  configuration.vaultManagerPendingOwner,
                  t('adminNone'),
                )}
              </dd>
            </div>

            <div>
              <dt>
                {t('adminConnectedWalletRole')}
              </dt>
              <dd
                data-testid="vault-manager-owner-access"
              >
                {authorization.isVaultManagerOwner
                  ? t('adminOwnerAccess')
                  : t('adminReadOnlyAccess')}
              </dd>
            </div>

            <div>
              <dt>
                {t('adminFeeReceiver')}
              </dt>
              <dd title={configuration.feeReceiver}>
                {shortenAddress(
                  configuration.feeReceiver,
                )}
              </dd>
            </div>
          </dl>
        </article>
      </div>

      <div className="admin-relationships">
        <h3>
          {t('adminRelationshipsHeading')}
        </h3>

        <dl className="admin-relationship-list">
          <div>
            <dt>
              SavingCore → MockUSDC
            </dt>
            <dd>
              {relationshipStatus(
                health.savingCoreTokenMatches,
              )}
            </dd>
          </div>

          <div>
            <dt>
              SavingCore → VaultManager
            </dt>
            <dd>
              {relationshipStatus(
                health.savingCoreVaultManagerMatches,
              )}
            </dd>
          </div>

          <div>
            <dt>
              VaultManager → MockUSDC
            </dt>
            <dd>
              {relationshipStatus(
                health.vaultManagerTokenMatches,
              )}
            </dd>
          </div>

          <div>
            <dt>
              VaultManager → SavingCore
            </dt>
            <dd>
              {relationshipStatus(
                health.vaultManagerSavingCoreMatches,
              )}
            </dd>
          </div>
        </dl>
      </div>
      {wallet && refresh ? (
        <div className="admin-pause-actions">
          <AdminProtocolPauseAction
            target="saving-core"
            paused={
              configuration.savingCorePaused
            }
            isOwner={
              authorization
                .isSavingCoreOwner
            }
            wallet={wallet}
            refresh={refresh}
          />

          <AdminProtocolPauseAction
            target="vault-manager"
            paused={
              configuration.vaultManagerPaused
            }
            isOwner={
              authorization
                .isVaultManagerOwner
            }
            wallet={wallet}
            refresh={refresh}
          />
        </div>
      ) : null}

      {wallet && refresh ? (
        <AdminFeeReceiverAction
          wallet={wallet}
          isVaultManagerOwner={
            authorization
              .isVaultManagerOwner
          }
          currentFeeReceiver={
            configuration.feeReceiver
          }
          refresh={refresh}
        />
      ) : null}
    </section>
  )
}