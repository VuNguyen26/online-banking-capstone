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
  LanguageProvider,
} from '../i18n/LanguageProvider'
import {
  AdminPlansPanel,
} from './AdminPlansPanel'

const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000'

const OWNER =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const TOKEN =
  '0xcf779EC5D80573D3254054a17c5B4f0117491662'

const VAULT =
  '0xA79F660FaB4Ebae6Ac4298034Cb3FD6d28e5D2f7'

const CORE =
  '0xa35c55e7E2dB5874699cC9fb8d0E25032f51b443'

function createData(
  plans: AdminDashboardData['plans'],
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
      savingCoreToken: TOKEN,
      savingCoreVaultManager: VAULT,
      vaultManagerToken: TOKEN,
      vaultManagerSavingCore: CORE,
      savingCorePaused: false,
      vaultManagerPaused: false,
    },
    authorization: {
      isSavingCoreOwner: true,
      isVaultManagerOwner: true,
      isSavingCorePendingOwner: false,
      isVaultManagerPendingOwner: false,
    },
    plans,
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
      <AdminPlansPanel data={data} />
    </LanguageProvider>,
  )
}

describe('AdminPlansPanel', () => {
  beforeEach(() => {
    localStorage.setItem(
      'safebank.language',
      'en',
    )
  })

  it('renders enabled and disabled plans with exact terms', () => {
    renderPanel(
      createData([
        {
          planId: 1n,
          tenorDays: 180n,
          aprBps: 200n,
          minDeposit: 100_000_000n,
          maxDeposit: 10_000_000_000n,
          earlyWithdrawPenaltyBps: 750n,
          enabled: true,
        },
        {
          planId: 2n,
          tenorDays: 365n,
          aprBps: 725n,
          minDeposit: 50_000_000n,
          maxDeposit: 5_000_000_000n,
          earlyWithdrawPenaltyBps: 500n,
          enabled: false,
        },
      ]),
    )

    expect(
      screen.getByText('Plan #1'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Plan #2'),
    ).toBeInTheDocument()

    expect(
      screen.getByTestId(
        'admin-plan-1-apr',
      ),
    ).toHaveTextContent('2%')

    expect(
      screen.getByTestId(
        'admin-plan-2-apr',
      ),
    ).toHaveTextContent('7.25%')

    expect(
      screen.getByText('Enabled'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Disabled'),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        '100 – 10000 mUSDC',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText('7.5%'),
    ).toBeInTheDocument()
  })

  it('renders an empty plan state', () => {
    renderPanel(createData([]))

    expect(
      screen.getByText(
        'No saving plans are currently available.',
      ),
    ).toBeInTheDocument()
  })
})