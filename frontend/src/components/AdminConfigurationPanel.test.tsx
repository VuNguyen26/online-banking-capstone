import {
  render,
  screen,
} from '@testing-library/react'
import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'

import type {
  AdminDashboardData,
} from '../contracts/adminDashboard'
import {
  SAFE_BANK_DEPLOYMENT,
} from '../contracts/generated/contracts'
import {
  LanguageProvider,
} from '../i18n/LanguageProvider'
import {
  AdminConfigurationPanel,
} from './AdminConfigurationPanel'

const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000'

const OWNER =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const OTHER_ADDRESS =
  '0x1111111111111111111111111111111111111111'

function createData(
  overrides: Partial<
    AdminDashboardData['configuration']
  > = {},
): AdminDashboardData {
  return {
    configuration: {
      savingCoreOwner: OWNER,
      savingCorePendingOwner:
        ZERO_ADDRESS,
      vaultManagerOwner: OWNER,
      vaultManagerPendingOwner:
        ZERO_ADDRESS,
      feeReceiver: OWNER,
      savingCoreToken:
        SAFE_BANK_DEPLOYMENT.contracts
          .MockUSDC.address,
      savingCoreVaultManager:
        SAFE_BANK_DEPLOYMENT.contracts
          .VaultManager.address,
      vaultManagerToken:
        SAFE_BANK_DEPLOYMENT.contracts
          .MockUSDC.address,
      vaultManagerSavingCore:
        SAFE_BANK_DEPLOYMENT.contracts
          .SavingCore.address,
      savingCorePaused: false,
      vaultManagerPaused: true,
      ...overrides,
    },
    authorization: {
      isSavingCoreOwner: true,
      isVaultManagerOwner: false,
      isSavingCorePendingOwner: false,
      isVaultManagerPendingOwner: false,
    },
    plans: [],
    depositCount: 0n,
    vaultMetrics: {
      vaultBalance: 0n,
      totalReservedInterest: 0n,
      availableLiquidity: 0n,
      fundingShortfall: 0n,
    },
    tokenAccountState: null,
  }
}

function renderPanel(
  data: AdminDashboardData,
) {
  return render(
    <LanguageProvider>
      <AdminConfigurationPanel
        data={data}
      />
    </LanguageProvider>,
  )
}

describe('AdminConfigurationPanel', () => {
  beforeEach(() => {
    localStorage.setItem(
      'safebank.language',
      'en',
    )
  })

  it('shows independent ownership, pause and relationship states', () => {
    renderPanel(createData())

    expect(
      screen.getByTestId(
        'saving-core-owner-access',
      ),
    ).toHaveTextContent('Owner access')

    expect(
      screen.getByTestId(
        'vault-manager-owner-access',
      ),
    ).toHaveTextContent('Read-only')

    expect(
      screen.getByText('Active'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Paused'),
    ).toBeInTheDocument()

    expect(
      screen.getAllByText('Matched'),
    ).toHaveLength(4)

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()
  })

  it('warns when one deployment relationship is mismatched', () => {
    renderPanel(
      createData({
        savingCoreToken:
          OTHER_ADDRESS,
      }),
    )

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'contract relationship does not match',
    )

    expect(
      screen.getAllByText('Mismatch'),
    ).toHaveLength(1)
  })
})