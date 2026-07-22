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
  AdminVaultPanel,
} from './AdminVaultPanel'

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
  overrides: Partial<
    AdminDashboardData['vaultMetrics']
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
    plans: [],
    depositCount: 0n,
    vaultMetrics: {
      vaultBalance: 1_500_000_000n,
      totalReservedInterest:
        200_000_000n,
      availableLiquidity:
        1_300_000_000n,
      fundingShortfall: 0n,
      ...overrides,
    },
    tokenAccountState: {
      balance: 5_000_000_000n,
      vaultManagerAllowance:
        500_000_000n,
    },
  }
}

function renderPanel(
  data: AdminDashboardData,
) {
  return render(
    <LanguageProvider>
      <AdminVaultPanel data={data} />
    </LanguageProvider>,
  )
}

describe('AdminVaultPanel', () => {
  beforeEach(() => {
    localStorage.setItem(
      'safebank.language',
      'en',
    )
  })

  it('renders C2 liquidity and connected-wallet metrics', () => {
    renderPanel(createData())

    expect(
      screen.getByTestId('vault-balance'),
    ).toHaveTextContent(
      '1500 mUSDC',
    )

    expect(
      screen.getByTestId('vault-reserved'),
    ).toHaveTextContent(
      '200 mUSDC',
    )

    expect(
      screen.getByTestId('vault-available'),
    ).toHaveTextContent(
      '1300 mUSDC',
    )

    expect(
      screen.getByTestId('vault-shortfall'),
    ).toHaveTextContent(
      '0 mUSDC',
    )

    expect(
      screen.getByTestId(
        'admin-wallet-balance',
      ),
    ).toHaveTextContent(
      '5000 mUSDC',
    )

    expect(
      screen.getByTestId(
        'admin-vault-allowance',
      ),
    ).toHaveTextContent(
      '500 mUSDC',
    )

    expect(
      screen.getByText('Healthy'),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()
  })

  it('warns about a funding shortfall and supports disconnected reads', () => {
    const data = createData({
      vaultBalance: 100_000_000n,
      totalReservedInterest:
        250_000_000n,
      availableLiquidity: 0n,
      fundingShortfall:
        150_000_000n,
    })

    data.tokenAccountState = null

    renderPanel(data)

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'does not fully cover reserved interest',
    )

    expect(
      screen.getByTestId('vault-shortfall'),
    ).toHaveTextContent(
      '150 mUSDC',
    )

    expect(
      screen.getByTestId(
        'admin-wallet-balance',
      ),
    ).toHaveTextContent(
      'Connect a wallet to view balance and allowance.',
    )
  })
})