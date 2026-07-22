import type { WalletContextValue } from '../providers/wallet-context'
import {
  render,
  screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import type {
  AdminDashboardData,
} from '../contracts/adminDashboard'
import {
  LanguageProvider,
} from '../i18n/LanguageProvider'
import {
  AdminDataContext,
  type AdminDataContextValue,
} from '../providers/admin-data-context'
import {
  AdminDashboard,
} from './AdminDashboard'

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

function createAdminData(): AdminDashboardData {
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
    plans: [
      {
        planId: 1n,
        tenorDays: 180n,
        aprBps: 200n,
        minDeposit: 100_000_000n,
        maxDeposit: 10_000_000_000n,
        earlyWithdrawPenaltyBps: 750n,
        enabled: true,
      },
    ],
    depositCount: 3n,
    vaultMetrics: {
      vaultBalance: 1_500_000_000n,
      totalReservedInterest:
        200_000_000n,
      availableLiquidity:
        1_300_000_000n,
      fundingShortfall: 0n,
    },
    tokenAccountState: {
      balance: 5_000_000_000n,
      vaultManagerAllowance:
        500_000_000n,
    },
  }
}

function createWallet():
  WalletContextValue {
  return {
    status: 'connected',
    walletAvailable: true,
    account:
      '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9',
    chainId: 11_155_111n,
    isConnected: true,
    isSepolia: true,
    isConnecting: false,
    isSwitchingNetwork: false,
    error: null,
    connectWallet: vi.fn(
      async () => undefined,
    ),
    switchToSepolia: vi.fn(
      async () => undefined,
    ),
    getSigner: vi.fn(
      async () => ({} as never),
    ),
    clearError: vi.fn(),
  }
}

function renderDashboard(
  context: AdminDataContextValue,
  onViewChange = vi.fn(),
) {
  render(
    <LanguageProvider>
      <AdminDataContext.Provider
        value={context}
      >
        <AdminDashboard
          wallet={createWallet()}
          onViewChange={onViewChange}
        />
      </AdminDataContext.Provider>
    </LanguageProvider>,
  )

  return onViewChange
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    localStorage.setItem(
      'safebank.language',
      'en',
    )
  })

  it('renders the loading state', () => {
    renderDashboard({
      status: 'loading',
      data: null,
      error: null,
      refresh: vi.fn(
        async () => undefined,
      ),
    })

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Loading Sepolia administration data',
    )
  })

  it('renders read failures and retries', async () => {
    const user = userEvent.setup()
    const refresh = vi.fn(
      async () => undefined,
    )

    renderDashboard({
      status: 'error',
      data: null,
      error: 'Admin RPC unavailable.',
      refresh,
    })

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'Admin RPC unavailable.',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Try again',
      }),
    )

    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('renders overview metrics and returns to user banking', async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()

    renderDashboard(
      {
        status: 'ready',
        data: createAdminData(),
        error: null,
        refresh: vi.fn(
          async () => undefined,
        ),
      },
      onViewChange,
    )

    expect(
      screen.getByTestId(
        'admin-plan-count',
      ),
    ).toHaveTextContent('1')

    expect(
      screen.getByTestId(
        'admin-deposit-count',
      ),
    ).toHaveTextContent('3')

    expect(
      screen.getByTestId(
        'admin-vault-balance',
      ),
    ).toHaveTextContent(
      '1500 mUSDC',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'User banking',
      }),
    )

    expect(onViewChange).toHaveBeenCalledWith(
      'user',
    )
  })
})