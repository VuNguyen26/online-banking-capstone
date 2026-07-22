import {
  useState,
  type FormEvent,
} from 'react'

import {
  createReadOnlyContracts,
} from '../contracts/client'
import {
  readAdminDeposit,
} from '../contracts/adminDeposit'
import type {
  DepositRecord,
} from '../contracts/models'
import {
  useLanguage,
} from '../i18n/useLanguage'
import type {
  TranslationKey,
} from '../i18n/translations'
import {
  formatBasisPoints,
} from '../lib/basisPoints'
import {
  getDepositStatusLabel,
} from '../lib/deposits'
import {
  formatMusdcAmount,
} from '../lib/units'

export type AdminDepositReader = (
  depositId: bigint,
) => Promise<DepositRecord>

type AdminDepositInspectionPanelProps = {
  readDeposit?: AdminDepositReader
}

async function readDepositFromPublicRpc(
  depositId: bigint,
): Promise<DepositRecord> {
  const {
    provider,
    contracts,
  } = createReadOnlyContracts()

  try {
    return await readAdminDeposit(
      contracts.savingCore,
      depositId,
    )
  } finally {
    provider.destroy()
  }
}

function parseDepositId(
  value: string,
): bigint | null {
  const normalized = value.trim()

  if (!/^\d+$/.test(normalized)) {
    return null
  }

  const depositId = BigInt(normalized)

  return depositId > 0n
    ? depositId
    : null
}

function formatUnixTimestamp(
  timestamp: bigint,
): string {
  const milliseconds =
    timestamp * 1000n

  if (
    milliseconds >
    BigInt(Number.MAX_SAFE_INTEGER)
  ) {
    return timestamp.toString()
  }

  return new Date(
    Number(milliseconds),
  )
    .toISOString()
    .replace('T', ' ')
    .replace('.000Z', ' UTC')
}

function getAdminDepositStatusKey(
  status: bigint,
): TranslationKey {
  switch (
    getDepositStatusLabel(status)
  ) {
    case 'Active':
      return 'adminDepositStatusActive'
    case 'Withdrawn':
      return 'adminDepositStatusWithdrawn'
    case 'Manually renewed':
      return 'adminDepositStatusManualRenewed'
    case 'Automatically renewed':
      return 'adminDepositStatusAutoRenewed'
    default:
      return 'adminDepositStatusUnknown'
  }
}

export function AdminDepositInspectionPanel({
  readDeposit =
    readDepositFromPublicRpc,
}: AdminDepositInspectionPanelProps) {
  const { t } = useLanguage()

  const [depositIdInput, setDepositIdInput] =
    useState('')

  const [deposit, setDeposit] =
    useState<DepositRecord | null>(null)

  const [isLoading, setIsLoading] =
    useState(false)

  const [readError, setReadError] =
    useState<string | null>(null)

  const depositId =
    parseDepositId(depositIdInput)

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (
      depositId === null ||
      isLoading
    ) {
      return
    }

    setIsLoading(true)
    setReadError(null)
    setDeposit(null)

    try {
      const result =
        await readDeposit(depositId)

      setDeposit(result)
    } catch {
      setReadError(
        t('adminDepositReadError'),
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section
      className="admin-panel admin-deposit-inspection"
      aria-labelledby="admin-deposit-inspection-heading"
    >
      <div className="admin-panel-heading">
        <div>
          <p className="section-kicker">
            {t('adminDepositInspectionKicker')}
          </p>

          <h2 id="admin-deposit-inspection-heading">
            {t('adminDepositInspectionHeading')}
          </h2>

          <p>
            {t('adminDepositInspectionDescription')}
          </p>
        </div>
      </div>

      <form
        className="admin-deposit-search-form"
        onSubmit={(event) => {
          void handleSubmit(event)
        }}
      >
        <label htmlFor="admin-deposit-id">
          {t('adminDepositId')}
        </label>

        <div className="admin-deposit-search-row">
          <input
            id="admin-deposit-id"
            type="text"
            inputMode="numeric"
            value={depositIdInput}
            disabled={isLoading}
            placeholder="1"
            onChange={(event) => {
              setDepositIdInput(
                event.target.value,
              )
              setDeposit(null)
              setReadError(null)
            }}
          />

          <button
            type="submit"
            className="primary-button"
            disabled={
              depositId === null ||
              isLoading
            }
          >
            {isLoading
              ? t('adminDepositSearching')
              : t('adminDepositSearch')}
          </button>
        </div>

        {depositIdInput.length > 0 &&
        depositId === null ? (
          <p
            className="form-error"
            role="alert"
          >
            {t('adminDepositIdError')}
          </p>
        ) : null}
      </form>

      {isLoading ? (
        <p
          className="admin-deposit-read-state"
          role="status"
        >
          {t('adminDepositLoading')}
        </p>
      ) : null}

      {readError ? (
        <p
          className="form-error"
          role="alert"
        >
          {readError}
        </p>
      ) : null}

      {deposit ? (
        <article className="admin-deposit-result">
          <div className="admin-deposit-result-heading">
            <h3>
              {t('adminDepositResult')}{' '}
              #{deposit.depositId.toString()}
            </h3>

            <span className="admin-status-badge admin-status-ok">
              {t(
                getAdminDepositStatusKey(
                  deposit.status,
                ),
              )}
            </span>
          </div>

          <dl className="admin-detail-list">
            <div>
              <dt>{t('adminDepositPlanId')}</dt>
              <dd>
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
              <dt>{t('adminPlanTenorDays')}</dt>
              <dd>
                {deposit.tenorDays.toString()}
              </dd>
            </div>

            <div>
              <dt>{t('adminPlanAprPercent')}</dt>
              <dd>
                {formatBasisPoints(
                  deposit.aprBpsAtOpen,
                )}
              </dd>
            </div>

            <div>
              <dt>
                {t('adminEarlyPenaltyPercent')}
              </dt>
              <dd>
                {formatBasisPoints(
                  deposit.penaltyBpsAtOpen,
                )}
              </dd>
            </div>

            <div>
              <dt>{t('adminDepositStartedAt')}</dt>
              <dd>
                <time>
                  {formatUnixTimestamp(
                    deposit.startedAt,
                  )}
                </time>
              </dd>
            </div>

            <div>
              <dt>{t('adminDepositMaturityAt')}</dt>
              <dd>
                <time>
                  {formatUnixTimestamp(
                    deposit.maturityAt,
                  )}
                </time>
              </dd>
            </div>
          </dl>
        </article>
      ) : null}
    </section>
  )
}