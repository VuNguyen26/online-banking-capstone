import type {
  SafeBankDataContextValue,
} from '../providers/safebank-data-context'
import type {
  WalletContextValue,
} from '../providers/wallet-context'
import {
  SAFE_BANK_DEPLOYMENT,
} from '../contracts/generated/contracts'
import {
  formatBasisPoints,
} from '../lib/basisPoints'
import {
  formatMusdcAmount,
} from '../lib/units'
import {
  shortenAddress,
} from '../lib/wallet'
import {
  OpenDepositPanel,
} from './OpenDepositPanel'
import {
  DepositPortfolioPanel,
} from './DepositPortfolioPanel'
import {
  TestTokenFaucet,
} from './TestTokenFaucet'
import {
  ApplicationShell,
  type ApplicationView,
} from './ApplicationShell'
import {
  UiStatePanel,
} from './UiStatePanel'
import {
  localizeProviderError,
} from '../i18n/providerErrors'
import {
  useLanguage,
} from '../i18n/useLanguage'


type UserDashboardProps = {
  wallet: WalletContextValue
  safeBank: SafeBankDataContextValue
  activeView?: ApplicationView
  onViewChange?: (
    view: ApplicationView,
  ) => void
}


function WalletSection({
  wallet,
}: {
  wallet: WalletContextValue
}) {
  const { t } = useLanguage()

  const walletStatusLabel =
    wallet.status === 'checking'
      ? t('walletStatusChecking')
      : wallet.status === 'unavailable'
        ? t('walletStatusUnavailable')
        : wallet.status === 'disconnected'
          ? t('walletStatusDisconnected')
          : wallet.status === 'connected'
            ? t('walletStatusConnected')
            : wallet.status

  return (
    <section
      className="panel wallet-panel"
      aria-labelledby="wallet-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {t('walletEyebrow')}
          </p>
          <h2 id="wallet-heading">
            {t('walletHeading')}
          </h2>
        </div>

        <span
          className={`status-badge status-${wallet.status}`}
        >
          {walletStatusLabel}
        </span>
      </div>

      {wallet.status === 'checking' && (
        <p role="status">
          {t('walletChecking')}
        </p>
      )}

      {wallet.status === 'unavailable' && (
        <div className="state-message">
          <strong>
            {t('walletUnavailableTitle')}
          </strong>
          <p>
            {t('walletUnavailableBody')}
          </p>
        </div>
      )}

      {wallet.status === 'disconnected' && (
        <div className="state-message">
          <strong>
            {t('walletDisconnectedTitle')}
          </strong>
          <p>
            {t('walletDisconnectedBody')}
          </p>

          <button
            className="primary-button"
            type="button"
            disabled={wallet.isConnecting}
            onClick={() => {
              void wallet.connectWallet()
            }}
          >
            {wallet.isConnecting
              ? t('walletWaiting')
              : t('walletConnect')}
          </button>
        </div>
      )}

      {wallet.status === 'connected' &&
        wallet.account && (
          <div className="wallet-details">
            <dl className="metric-list">
              <div>
                <dt>{t('connectedAccount')}</dt>
                <dd title={wallet.account}>
                  {shortenAddress(wallet.account)}
                </dd>
              </div>

              <div>
                <dt>{t('walletChainId')}</dt>
                <dd>
                  {wallet.chainId?.toString() ??
                    t('unknown')}
                </dd>
              </div>
            </dl>

            {!wallet.isSepolia && (
              <div
                className="warning-message"
                role="alert"
              >
                <strong>{t('wrongNetwork')}</strong>
                <p>
                  {t('wrongNetworkBody')}
                </p>

                <button
                  className="secondary-button"
                  type="button"
                  disabled={
                    wallet.isSwitchingNetwork
                  }
                  onClick={() => {
                    void wallet.switchToSepolia()
                  }}
                >
                  {wallet.isSwitchingNetwork
                    ? t('switchingNetwork')
                    : t('switchToSepolia')}
                </button>
              </div>
            )}

            {wallet.isSepolia && (
              <p className="success-message">
                {t('connectedToSepolia')}
              </p>
            )}
          </div>
        )}

      {wallet.error && (
        <div
          className="error-message"
          role="alert"
        >
          <p>
            {localizeProviderError(
              wallet.error,
              t,
            )}
          </p>

          <button
            className="text-button"
            type="button"
            onClick={wallet.clearError}
          >
            {t('dismissWalletError')}
          </button>
        </div>
      )}
    </section>
  )
}

function ContractLinks() {
  const { t } = useLanguage()

  return (
    <section
      className="panel"
      aria-labelledby="contracts-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {t('contractsEyebrow')}
          </p>
          <h2 id="contracts-heading">
            {t('contractsHeading')}
          </h2>
        </div>
      </div>

      <ul className="contract-list">
        {Object.entries(
          SAFE_BANK_DEPLOYMENT.contracts,
        ).map(([name, contract]) => (
          <li key={name}>
            <div>
              <strong>{name}</strong>
              <code>{contract.address}</code>
            </div>

            <a
              href={contract.explorerUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`${t('view')} ${name} ${t('onEtherscan')}`}
            >
              {t('viewSource')}
            </a>
          </li>
        ))}
      </ul>

      <p className="supporting-copy">
        {t('contractsNotice')}
      </p>
    </section>
  )
}

function DashboardData({
  wallet,
  safeBank,
}: {
  wallet: WalletContextValue
  safeBank: SafeBankDataContextValue
}) {
  const { t } = useLanguage()

  if (safeBank.status === 'loading') {
    return (
      <UiStatePanel
        kind="loading"
        title={t('loadingState')}
        message={t('loadingDescription')}
      />
    )
  }

  if (
    safeBank.status === 'error' ||
    safeBank.data === null
  ) {
    return (
      <UiStatePanel
        kind="error"
        title={t('loadErrorTitle')}
        message={
          localizeProviderError(
            safeBank.error,
            t,
          ) ?? t('publicStateUnavailable')
        }
        actionLabel={t('retryPublicReads')}
        onAction={() => {
          void safeBank.refresh()
        }}
      />
    )
  }

  const {
    plans,
    protocolStatus,
    tokenAccountState,
    vaultMetrics,
  } = safeBank.data

  return (
    <>
      <section
        className="panel"
        aria-labelledby="protocol-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {t('liveContractReads')}
            </p>
            <h2 id="protocol-heading">
              {t('protocolStatus')}
            </h2>
          </div>

          <button
            className="text-button"
            type="button"
            onClick={() => {
              void safeBank.refresh()
            }}
          >
            {t('refreshState')}
          </button>
        </div>

        <dl className="metrics-grid">
          <div>
            <dt>{t('protocolSavingPlans')}</dt>
            <dd>
              {protocolStatus.planCount.toString()}
            </dd>
          </div>

          <div>
            <dt>{t('totalDeposits')}</dt>
            <dd>
              {protocolStatus.depositCount.toString()}
            </dd>
          </div>

          <div>
            <dt>SavingCore</dt>
            <dd>
              {protocolStatus.savingCorePaused
                ? t('protocolPaused')
                : t('protocolActive')}
            </dd>
          </div>

          <div>
            <dt>VaultManager</dt>
            <dd>
              {protocolStatus.vaultManagerPaused
                ? t('protocolPaused')
                : t('protocolActive')}
            </dd>
          </div>

          <div>
            <dt>{t('latestBlockTimestamp')}</dt>
            <dd>
              {protocolStatus.latestBlockTimestamp
                .toString()}
            </dd>
          </div>

          <div>
            <dt>{t('gracePeriod')}</dt>
            <dd>
              {(
                protocolStatus.gracePeriodSeconds /
                86_400n
              ).toString()}{' '}
              {t('days')}
            </dd>
          </div>
        </dl>
      </section>

      <section
        className="panel"
        aria-labelledby="account-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {t('accountEyebrow')}
            </p>
            <h2 id="account-heading">
              {t('musdcAccountHeading')}
            </h2>
          </div>
        </div>

        {tokenAccountState === null ? (
          <p className="empty-copy">
            {t('accountConnectDescription')}
          </p>
        ) : (
          <dl className="metrics-grid">
            <div>
              <dt>{t('accountMusdcBalance')}</dt>
              <dd>
                {formatMusdcAmount(
                  tokenAccountState.balance,
                )}{' '}
                mUSDC
              </dd>
            </div>

            <div>
              <dt>{t('accountSavingCoreAllowance')}</dt>
              <dd>
                {formatMusdcAmount(
                  tokenAccountState.allowance,
                )}{' '}
                mUSDC
              </dd>
            </div>
          </dl>
        )}

        <p className="supporting-copy">
          {t('musdcTestTokenNotice')}
        </p>

        <TestTokenFaucet
          wallet={wallet}
          safeBank={safeBank}
        />
      </section>

      <section
        className="panel"
        aria-labelledby="plans-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {t('termDeposits')}
            </p>
            <h2 id="plans-heading">
              {t('savingPlansHeading')}
            </h2>
          </div>
        </div>

        {plans.length === 0 ? (
          <p className="empty-copy">
            {t('noSavingPlans')}
          </p>
        ) : (
          <div className="plan-grid">
            {plans.map((plan) => (
              <article
                className="plan-card"
                key={plan.planId.toString()}
              >
                <div className="plan-card-header">
                  <div>
                    <p className="eyebrow">
                      {t('plan')} #{plan.planId.toString()}
                    </p>
                    <h3>
                      {t('planTerm')}{' '}
                      {plan.tenorDays.toString()}{' '}
                      {t('days')}
                    </h3>
                  </div>

                  <span
                    className={
                      plan.enabled
                        ? 'status-badge status-connected'
                        : 'status-badge status-unavailable'
                    }
                  >
                    {plan.enabled
                      ? t('planEnabled')
                      : t('planDisabled')}
                  </span>
                </div>

                <dl className="plan-details">
                  <div>
                    <dt>APR</dt>
                    <dd>
                      {formatBasisPoints(
                        plan.aprBps,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>{t('depositRange')}</dt>
                    <dd>
                      {formatMusdcAmount(
                        plan.minDeposit,
                      )}{' '}
                      –{' '}
                      {formatMusdcAmount(
                        plan.maxDeposit,
                      )}{' '}
                      mUSDC
                    </dd>
                  </div>

                  <div>
                    <dt>{t('earlyPenalty')}</dt>
                    <dd>
                      {formatBasisPoints(
                        plan.earlyWithdrawPenaltyBps,
                      )}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>

      <section
        className="panel"
        aria-labelledby="vault-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {t('c2Transparency')}
            </p>
            <h2 id="vault-heading">
              {t('interestVaultHeading')}
            </h2>
          </div>
        </div>

        <dl className="metrics-grid">
          <div>
            <dt>{t('vaultBalance')}</dt>
            <dd>
              {formatMusdcAmount(
                vaultMetrics.vaultBalance,
              )}{' '}
              mUSDC
            </dd>
          </div>

          <div>
            <dt>{t('reservedInterest')}</dt>
            <dd>
              {formatMusdcAmount(
                vaultMetrics.totalReservedInterest,
              )}{' '}
              mUSDC
            </dd>
          </div>

          <div>
            <dt>{t('availableLiquidity')}</dt>
            <dd>
              {formatMusdcAmount(
                vaultMetrics.availableLiquidity,
              )}{' '}
              mUSDC
            </dd>
          </div>

          <div>
            <dt>{t('fundingShortfall')}</dt>
            <dd>
              {formatMusdcAmount(
                vaultMetrics.fundingShortfall,
              )}{' '}
              mUSDC
            </dd>
          </div>
        </dl>

        {vaultMetrics.fundingShortfall > 0n ? (
          <div
            className="warning-message"
            role="alert"
          >
            <strong>
              {t('interestVaultUnderfunded')}
            </strong>
            <p>
              {t('underfundedDescription')}
            </p>
          </div>
        ) : (
          <p className="supporting-copy">
            {t('zeroShortfallNotice')}
          </p>
        )}
      </section>
    </>
  )
}

export function UserDashboard({
  wallet,
  safeBank,
  activeView,
  onViewChange,
}: UserDashboardProps) {
  return (
    <ApplicationShell
      activeView={activeView}
      onViewChange={onViewChange}
    >
      <div className="dashboard-top-grid">
        <div className="dashboard-main">
          <WalletSection wallet={wallet} />

          <OpenDepositPanel
            wallet={wallet}
            safeBank={safeBank}
          />
        </div>

        <div className="dashboard-sidebar">
          <ContractLinks />
        </div>
      </div>

      <div className="dashboard-full-width">
        <DepositPortfolioPanel
          wallet={wallet}
          safeBank={safeBank}
        />

        <DashboardData
          wallet={wallet}
          safeBank={safeBank}
        />
      </div>
    </ApplicationShell>
  )
}
