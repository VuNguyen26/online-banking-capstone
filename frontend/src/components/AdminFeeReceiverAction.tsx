import {
  useState,
} from 'react'
import {
  ZeroAddress,
  getAddress,
  type JsonRpcSigner,
} from 'ethers'

import {
  updateVaultFeeReceiver,
} from '../contracts/adminWrite'
import {
  createSignerContracts,
} from '../contracts/client'
import {
  useTransaction,
} from '../hooks/useTransaction'
import {
  useLanguage,
} from '../i18n/useLanguage'
import type {
  WalletContextValue,
} from '../providers/wallet-context'
import {
  AdminTransactionFeedback,
} from './AdminTransactionFeedback'
import {
  ConfirmationDialog,
} from './ConfirmationDialog'

export type CreateAdminFeeReceiverContracts = (
  signer: JsonRpcSigner,
) => {
  vaultManager: unknown
}

type AdminFeeReceiverActionProps = {
  wallet: WalletContextValue
  isVaultManagerOwner: boolean
  currentFeeReceiver: string
  refresh: () => Promise<void>
  createWriteContracts?:
    CreateAdminFeeReceiverContracts
}

function createDefaultWriteContracts(
  signer: JsonRpcSigner,
): {
  vaultManager: unknown
} {
  const contracts =
    createSignerContracts(signer)

  return {
    vaultManager:
      contracts.vaultManager,
  }
}

export function AdminFeeReceiverAction({
  wallet,
  isVaultManagerOwner,
  currentFeeReceiver,
  refresh,
  createWriteContracts =
    createDefaultWriteContracts,
}: AdminFeeReceiverActionProps) {
  const { t } = useLanguage()

  const [addressInput, setAddressInput] =
    useState(currentFeeReceiver)

  const [addressTouched, setAddressTouched] =
    useState(false)

  const [
    feeReceiverConfirmationOpen,
    setFeeReceiverConfirmationOpen,
  ] = useState(false)

  const transaction = useTransaction()

  let normalizedAddress:
    string | null = null

  let validationError:
    string | null = null

  try {
    normalizedAddress =
      getAddress(addressInput.trim())

    if (
      normalizedAddress === ZeroAddress
    ) {
      validationError =
        t('adminFeeReceiverZeroError')
    } else if (
      normalizedAddress ===
      getAddress(currentFeeReceiver)
    ) {
      validationError =
        t('adminFeeReceiverUnchanged')
    }
  } catch {
    validationError =
      t('adminFeeReceiverInvalid')
  }

  const canSubmit =
    wallet.isConnected &&
    wallet.isSepolia &&
    isVaultManagerOwner &&
    normalizedAddress !== null &&
    validationError === null &&
    !transaction.isPending

  const handleSubmit = async () => {
    if (
      !canSubmit ||
      normalizedAddress === null
    ) {
      return
    }

    const result =
      await transaction.execute(
        async () => {
          const signer =
            await wallet.getSigner()

          const contracts =
            createWriteContracts(signer)

          return updateVaultFeeReceiver(
            contracts.vaultManager,
            normalizedAddress,
          )
        },
      )

    if (result) {
      await refresh()
    }
  }

  let guidance: string | null = null

  if (!wallet.isConnected) {
    guidance =
      t('adminConnectWalletAction')
  } else if (!wallet.isSepolia) {
    guidance =
      t('adminSwitchSepoliaAction')
  } else if (!isVaultManagerOwner) {
    guidance =
      t('adminVaultManagerOwnerRequired')
  }

  return (
    <section
      className="admin-fee-receiver-action"
      aria-labelledby="admin-fee-receiver-heading"
    >
      <div>
        <h3 id="admin-fee-receiver-heading">
          {t('adminFeeReceiverUpdateHeading')}
        </h3>

        <p>
          {t('adminFeeReceiverUpdateDescription')}
        </p>
      </div>

      <div className="admin-fee-receiver-form">
        <label htmlFor="admin-fee-receiver-input">
          {t('adminNewFeeReceiver')}
        </label>

        <input
          id="admin-fee-receiver-input"
          type="text"
          value={addressInput}
          disabled={transaction.isPending}
          onChange={(event) => {
            setAddressInput(
              event.target.value,
            )
            setAddressTouched(true)
            setFeeReceiverConfirmationOpen(
              false,
            )
            transaction.reset()
          }}
        />

        {guidance ? (
          <p className="form-guidance">
            {guidance}
          </p>
        ) : null}

        {!guidance &&
        addressTouched &&
        addressInput.length > 0 &&
        validationError ? (
          <p
            className="form-error"
            role="alert"
          >
            {validationError}
          </p>
        ) : null}

        <button
          type="button"
          className="secondary-button"
          disabled={!canSubmit}
          onClick={() => {
            if (!canSubmit) {
              return
            }

            setFeeReceiverConfirmationOpen(
              true,
            )
          }}
        >
          {transaction.isPending
            ? t('adminUpdatingFeeReceiver')
            : t('adminUpdateFeeReceiver')}
        </button>
      </div>

      <AdminTransactionFeedback
        label={t('adminFeeReceiverTransaction')}
        state={transaction.state}
      />

      {normalizedAddress !== null ? (
        <ConfirmationDialog
          open={feeReceiverConfirmationOpen}
          title={t(
            'adminFeeReceiverConfirmationTitle',
          )}
          description={t(
            'adminFeeReceiverConfirmationDescription',
          )}
          confirmLabel={t(
            'confirmationContinueToWallet',
          )}
          cancelLabel={t(
            'confirmationCancel',
          )}
          tone="danger"
          onCancel={() => {
            setFeeReceiverConfirmationOpen(
              false,
            )
          }}
          onConfirm={() => {
            setFeeReceiverConfirmationOpen(
              false,
            )
            void handleSubmit()
          }}
        >
          <dl>
            <div>
              <dt>
                {t(
                  'confirmationCurrentAddress',
                )}
              </dt>
              <dd title={currentFeeReceiver}>
                {currentFeeReceiver}
              </dd>
            </div>

            <div>
              <dt>
                {t(
                  'confirmationNewAddress',
                )}
              </dt>
              <dd title={normalizedAddress}>
                {normalizedAddress}
              </dd>
            </div>
          </dl>
        </ConfirmationDialog>
      ) : null}
    </section>
  )
}