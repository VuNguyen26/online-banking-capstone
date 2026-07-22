import type {
  AdminDashboardData,
} from '../contracts/adminDashboard'
import {
  useLanguage,
} from '../i18n/useLanguage'
import {
  formatBasisPoints,
} from '../lib/basisPoints'
import {
  formatMusdcAmount,
} from '../lib/units'
import type {
  WalletContextValue,
} from '../providers/wallet-context'
import {
  AdminCreatePlanAction,
} from './AdminCreatePlanAction'
import {
  AdminPlanAprAction,
} from './AdminPlanAprAction'
import {
  AdminPlanToggleAction,
} from './AdminPlanToggleAction'
import {
  UiStatePanel,
} from './UiStatePanel'

type AdminPlansPanelProps = {
  data: AdminDashboardData
  wallet?: WalletContextValue
  refresh?: () => Promise<void>
}

export function AdminPlansPanel({
  data,
  wallet,
  refresh,
}: AdminPlansPanelProps) {
  const { t } = useLanguage()
  const { plans } = data

  return (
    <section
      className="panel admin-plans-panel"
      aria-labelledby="admin-plans-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {t('adminPlansEyebrow')}
          </p>

          <h2 id="admin-plans-heading">
            {t('adminPlansHeading')}
          </h2>

          <p>
            {t('adminPlansDescription')}
          </p>
        </div>
      </div>

      {wallet && refresh ? (
        <AdminCreatePlanAction
          wallet={wallet}
          isSavingCoreOwner={
            data.authorization
              .isSavingCoreOwner
          }
          refresh={refresh}
        />
      ) : null}

      {plans.length === 0 ? (
        <UiStatePanel
          kind="empty"
          message={t('noSavingPlans')}
        />
      ) : (
        <div className="admin-plan-grid">
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

                  <dd data-testid={`admin-plan-${plan.planId}-apr`}>
                    {formatBasisPoints(
                      plan.aprBps,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>
                    {t('depositRange')}
                  </dt>

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
                  <dt>
                    {t('earlyPenalty')}
                  </dt>

                  <dd>
                    {formatBasisPoints(
                      plan.earlyWithdrawPenaltyBps,
                    )}
                  </dd>
                </div>
              </dl>

              {wallet && refresh ? (
                <div className="admin-plan-management">
                  <AdminPlanAprAction
                    plan={plan}
                    wallet={wallet}
                    isSavingCoreOwner={
                      data.authorization
                        .isSavingCoreOwner
                    }
                    refresh={refresh}
                  />

                  <AdminPlanToggleAction
                    plan={plan}
                    wallet={wallet}
                    isSavingCoreOwner={
                      data.authorization
                        .isSavingCoreOwner
                    }
                    refresh={refresh}
                  />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}