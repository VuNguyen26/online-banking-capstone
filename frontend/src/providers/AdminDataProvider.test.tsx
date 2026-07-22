import {
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import type { JsonRpcSigner } from 'ethers'
import { vi } from 'vitest'

import type {
  AdminDashboardData,
} from '../contracts/adminDashboard'
import { useAdminData } from '../hooks/useAdminData'
import {
  WalletContext,
  type WalletContextValue,
} from './wallet-context'
import {
  AdminDataProvider,
  type AdminDashboardLoader,
  type AdminReadClient,
} from './AdminDataProvider'

const ACCOUNT =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000'

const TOKEN =
  '0xcf779EC5D80573D3254054a17c5B4f0117491662'

const VAULT =
  '0xA79F660FaB4Ebae6Ac4298034Cb3FD6d28e5D2f7'

const CORE =
  '0xa35c55e7E2dB5874699cC9fb8d0E25032f51b443'

const readClient: AdminReadClient = {
  contracts: {
    mockUsdc: {
      name: 'mock-token',
    },
    vaultManager: {
      name: 'mock-vault',
    },
    savingCore: {
      name: 'mock-core',
    },
  },
}

function createWalletValue(
  account: string | null,
): WalletContextValue {
  return {
    status:
      account === null
        ? 'disconnected'
        : 'connected',
    walletAvailable: true,
    account,
    chainId: 11_155_111n,
    isConnected: account !== null,
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
      async (): Promise<JsonRpcSigner> => {
        throw new Error(
          'Signer is not used by admin data-provider tests.',
        )
      },
    ),
    clearError: vi.fn(),
  }
}

function createAdminData(
  account: string | null,
): AdminDashboardData {
  const isOwner =
    account === ACCOUNT

  return {
    configuration: {
      savingCoreOwner: ACCOUNT,
      savingCorePendingOwner:
        ZERO_ADDRESS,
      vaultManagerOwner: ACCOUNT,
      vaultManagerPendingOwner:
        ZERO_ADDRESS,
      feeReceiver: ACCOUNT,
      savingCoreToken: TOKEN,
      savingCoreVaultManager: VAULT,
      vaultManagerToken: TOKEN,
      vaultManagerSavingCore: CORE,
      savingCorePaused: false,
      vaultManagerPaused: false,
    },
    authorization: {
      isSavingCoreOwner: isOwner,
      isVaultManagerOwner: isOwner,
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
    tokenAccountState:
      account === null
        ? null
        : {
            balance: 5_000_000n,
            vaultManagerAllowance:
              2_000_000n,
          },
  }
}

function AdminDataProbe() {
  const admin = useAdminData()

  return (
    <div>
      <output data-testid="admin-status">
        {admin.status}
      </output>

      <output data-testid="admin-error">
        {admin.error ?? 'none'}
      </output>

      <output data-testid="core-owner">
        {admin.data?.authorization
          .isSavingCoreOwner
          ? 'yes'
          : 'no'}
      </output>

      <output data-testid="admin-balance">
        {admin.data?.tokenAccountState
          ?.balance.toString() ?? 'none'}
      </output>
    </div>
  )
}

function createTree(
  account: string | null,
  loader: AdminDashboardLoader,
) {
  return (
    <WalletContext.Provider
      value={createWalletValue(account)}
    >
      <AdminDataProvider
        readClient={readClient}
        loader={loader}
      >
        <AdminDataProbe />
      </AdminDataProvider>
    </WalletContext.Provider>
  )
}

describe('AdminDataProvider', () => {
  it('loads public admin data without a wallet', async () => {
    const loader: AdminDashboardLoader =
      async ({ account }) =>
        createAdminData(account)

    render(
      createTree(null, loader),
    )

    await waitFor(() => {
      expect(
        screen.getByTestId(
          'admin-status',
        ),
      ).toHaveTextContent('ready')
    })

    expect(
      screen.getByTestId('core-owner'),
    ).toHaveTextContent('no')

    expect(
      screen.getByTestId(
        'admin-balance',
      ),
    ).toHaveTextContent('none')
  })

  it('reloads when the connected account changes', async () => {
    const loadedAccounts:
      Array<string | null> = []

    const loader: AdminDashboardLoader =
      async ({ account }) => {
        loadedAccounts.push(account)

        return createAdminData(account)
      }

    const view = render(
      createTree(null, loader),
    )

    await waitFor(() => {
      expect(loadedAccounts).toEqual([
        null,
      ])
    })

    view.rerender(
      createTree(ACCOUNT, loader),
    )

    await waitFor(() => {
      expect(loadedAccounts).toEqual([
        null,
        ACCOUNT,
      ])
    })

    expect(
      screen.getByTestId('core-owner'),
    ).toHaveTextContent('yes')

    expect(
      screen.getByTestId(
        'admin-balance',
      ),
    ).toHaveTextContent('5000000')
  })

  it('exposes admin read failures', async () => {
    const loader: AdminDashboardLoader =
      async () => {
        throw new Error(
          'Admin RPC unavailable.',
        )
      }

    render(
      createTree(null, loader),
    )

    await waitFor(() => {
      expect(
        screen.getByTestId(
          'admin-status',
        ),
      ).toHaveTextContent('error')
    })

    expect(
      screen.getByTestId('admin-error'),
    ).toHaveTextContent(
      'Admin RPC unavailable.',
    )
  })
})