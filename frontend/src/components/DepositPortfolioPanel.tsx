import type {
  DepositActionAvailability,
} from '../lib/depositActions'
import {
  canClaimPendingInterest,
  getDepositActionAvailability,
} from '../lib/depositActions'
import {
  getDepositStatusLabel,
} from '../lib/deposits'
import {
  formatUnixTimestampUtc,
} from '../lib/dateTime'
import { useLanguage } from '../i18n/useLanguage'
import type {
  TranslationKey,
} from '../i18n/translations'
import {
  formatMusdcAmount,
} from '../lib/units'
import type {
  SafeBankDataContextValue,
} from '../providers/safebank-data-context'
import type {
  WalletContextValue,
} from '../providers/wallet-context'
import {
  DepositLifecycleActions,
} from './DepositLifecycleActions'
import {
  PendingInterestClaimAction,
} from './PendingInterestClaimAction'

type DepositPortfolioPanelProps = {
  wallet: WalletContextValue
  safeBank: SafeBankDataContextValue
}

function getAvailableActionLabels(
  availability:
    DepositActionAvailability,
  t: (key: TranslationKey) => string,
): string[] {
  const labels: string[] = []

  if (
    availability.canEarlyWithdraw
  ) {
    labels.push(t('actionEarlyWithdrawal'))
  }

  if (
    availability
      .canWithdrawAtMaturity
  ) {
    labels.push(
      t('actionMaturityWithdrawal'),
    )
  }

  if (
    availability.canManualRenew
  ) {
    labels.push(t('actionManualRenewal'))
  }

  if (
    availability.canAutoRenew
  ) {
    labels.push(t('actionAutoRenewal'))
  }

  return labels
}

function getLocalizedDepositStatus(
  status: bigint,
  t: (key: TranslationKey) => string,
): string {
  const label =
    getDepositStatusLabel(status)

  switch (label) {
    case 'Active':
      return t('depositStatusActive')
    case 'Withdrawn':
      return t('depositStatusWithdrawn')
    case 'Manually renewed':
      return t('depositStatusManualRenewed')
    case 'Automatically renewed':
      return t('depositStatusAutoRenewed')
  }
}

export function DepositPortfolioPanel({
  wallet,
  safeBank,
}: DepositPortfolioPanelProps) {
  const { t } = useLanguage()

  if (!wallet.isConnected) {
    return (
      <section
        className="panel"
        aria-labelledby="portfolio-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {t('portfolioEyebrow')}
            </p>
            <h2 id="portfolio-heading">
              {t('portfolioHeading')}
            </h2>
          </div>
        </div>

        <p className="empty-state">
          {t('portfolioConnect')}
        </p>
      </section>
    )
  }

  if (safeBank.status === 'loading') {
    return (
      <section
        className="panel"
        aria-labelledby="portfolio-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {t('portfolioEyebrow')}
            </p>
            <h2 id="portfolio-heading">
              {t('portfolioHeading')}
            </h2>
          </div>
        </div>

        <p
          className="empty-state"
          role="status"
        >
          {t('portfolioLoading')}
        </p>
      </section>
    )
  }

  if (safeBank.status === 'error') {
    return (
      <section
        className="panel"
        aria-labelledby="portfolio-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {t('portfolioEyebrow')}
            </p>
            <h2 id="portfolio-heading">
              {t('portfolioHeading')}
            </h2>
          </div>
        </div>

        <p
          className="form-error"
          role="alert"
        >
          {safeBank.error ??
            t('portfolioLoadError')}
        </p>
      </section>
    )
  }

  const dashboardData =
    safeBank.data

  if (dashboardData === null) {
    return (
      <section
        className="panel"
        aria-labelledby="portfolio-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {t('portfolioEyebrow')}
            </p>
            <h2 id="portfolio-heading">
              {t('portfolioHeading')}
            </h2>
          </div>
        </div>

        <p
          className="form-error"
          role="alert"
        >
          {t('portfolioUnavailable')}
        </p>
      </section>
    )
  }

  const {
    plans,
    ownedDeposits,
    pendingInterestClaims,
    protocolStatus,
  } = dashboardData

  const enabledPlans =
    plans.filter(
      (plan) => plan.enabled,
    )

  const savingCorePaused =
    protocolStatus.savingCorePaused

  const account = wallet.account

  return (
    <section
      className="panel"
      aria-labelledby="portfolio-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {t('portfolioEyebrow')}
          </p>
          <h2 id="portfolio-heading">
            {t('portfolioHeading')}
          </h2>
        </div>

        <span className="count-badge">
          {ownedDeposits.length}{' '}
          {ownedDeposits.length === 1
            ? t('certificate')
            : t('certificates')}
        </span>
      </div>

      <p className="supporting-copy">
        {t('lifecycleTimingDescription')}
      </p>

      {savingCorePaused && (
        <p
          className="form-guidance"
          role="status"
        >
          {t('portfolioPaused')}
        </p>
      )}

      {ownedDeposits.length === 0 ? (
        <p className="empty-state">
          {t('noOwnedCertificates')}
        </p>
      ) : (
        <div className="deposit-card-grid">
          {ownedDeposits.map(
            (deposit) => {
              const availability =
                getDepositActionAvailability(
                  deposit,
                  protocolStatus
                    .latestBlockTimestamp,
                  protocolStatus
                    .gracePeriodSeconds,
                  savingCorePaused,
                )

              const actionLabels =
                getAvailableActionLabels(
                  availability,
                  t,
                )

              return (
                <article
                  key={deposit.depositId.toString()}
                  className="deposit-card"
                  aria-label={`${t('depositCertificate')} ${deposit.depositId.toString()}`}
                >
                  <div className="deposit-card-header">
                    <div>
                      <p className="eyebrow">
                        {t('nftCertificate')}
                      </p>
                      <h3>
                        {t('deposit')} #
                        {deposit.depositId.toString()}
                      </h3>
                    </div>

                    <span
                      className={
                        availability.isActive
                          ? 'status-badge status-active'
                          : 'status-badge'
                      }
                    >
                      {getLocalizedDepositStatus(
                        deposit.status,
                        t,
                      )}
                    </span>
                  </div>

                  <dl className="deposit-details">
                    <div>
                      <dt>{t('plan')}</dt>
                      <dd>
                        #
                        {deposit.planId.toString()}
                      </dd>
                    </div>

                    <div>
                      <dt>{t('principal')}</dt>
                      <dd>
                        {formatMusdcAmount(
                          deposit.principal,
                        )}{' '}
                        mUSDC
                      </dd>
                    </div>

                    <div>
                      <dt>{t('aprAtOpening')}</dt>
                      <dd>
                        {(
                          Number(
                            deposit.aprBpsAtOpen,
                          ) / 100
                        ).toFixed(2)}
                        %
                      </dd>
                    </div>

                    <div>
                      <dt>{t('earlyPenalty')}</dt>
                      <dd>
                        {(
                          Number(
                            deposit
                              .penaltyBpsAtOpen,
                          ) / 100
                        ).toFixed(2)}
                        %
                      </dd>
                    </div>

                    <div>
                      <dt>{t('started')}</dt>
                      <dd>
                        {formatUnixTimestampUtc(
                          deposit.startedAt,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>{t('maturity')}</dt>
                      <dd>
                        {formatUnixTimestampUtc(
                          deposit.maturityAt,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>{t('graceEnds')}</dt>
                      <dd>
                        {formatUnixTimestampUtc(
                          availability.timing
                            .graceEndsAt,
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div className="availability-box">
                    <strong>
                      {t('currentlyAvailable')}
                    </strong>

                    {actionLabels.length ===
                    0 ? (
                      <p>
                        {t('noLifecycleAction')}
                      </p>
                    ) : (
                      <ul>
                        {actionLabels.map(
                          (label) => (
                            <li key={label}>
                              {label}
                            </li>
                          ),
                        )}
                      </ul>
                    )}
                  </div>

                  <DepositLifecycleActions
                    wallet={wallet}
                    safeBank={safeBank}
                    deposit={deposit}
                    availability={availability}
                    enabledPlans={enabledPlans}
                  />
                </article>
              )
            },
          )}
        </div>
      )}

      <div className="claim-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {t('principalFirstSettlement')}
            </p>
            <h3>
              {t('deferredInterestClaims')}
            </h3>
          </div>

          <span className="count-badge">
            {pendingInterestClaims.length}
          </span>
        </div>

        <p className="supporting-copy">
          {t('deferredInterestDescription')}
        </p>

        {pendingInterestClaims.length ===
        0 ? (
          <p className="empty-state">
            {t('noDeferredInterest')}
          </p>
        ) : (
          <div className="claim-list">
            {pendingInterestClaims.map(
              (claim) => {
                const claimAvailable =
                  account !== null &&
                  canClaimPendingInterest(
                    claim,
                    account,
                    savingCorePaused,
                  )

                return (
                  <article
                    key={claim.depositId.toString()}
                    className="claim-card"
                    aria-label={`${t('deferredInterestForDeposit')} ${claim.depositId.toString()}`}
                  >
                    <div>
                      <strong>
                        {t('deposit')} #
                        {claim.depositId.toString()}
                      </strong>

                      <p>
                        {formatMusdcAmount(
                          claim.amount,
                        )}{' '}
                        {t('interestPending')}
                      </p>
                    </div>

                    <div className="claim-card-actions">
                      <span
                        className={
                          claimAvailable
                            ? 'status-badge status-active'
                            : 'status-badge'
                        }
                      >
                        {claimAvailable
                          ? t('claimAvailable')
                          : t('claimUnavailable')}
                      </span>

                      <PendingInterestClaimAction
                        wallet={wallet}
                        safeBank={safeBank}
                        claim={claim}
                        savingCorePaused={
                          savingCorePaused
                        }
                      />
                    </div>
                  </article>
                )
              },
            )}
          </div>
        )}
      </div>
    </section>
  )
}
