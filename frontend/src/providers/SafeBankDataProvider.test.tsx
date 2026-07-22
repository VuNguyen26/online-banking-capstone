import {
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { JsonRpcSigner } from 'ethers'
import { vi } from 'vitest'

import type {
  LoadSafeBankDashboardArguments,
  SafeBankDashboardData,
} from '../contracts/dashboard'
import { useSafeBankData } from '../hooks/useSafeBankData'
import {
  WalletContext,
  type WalletContextValue,
} from './wallet-context'
import {
  SafeBankDataProvider,
  type SafeBankDashboardLoader,
  type SafeBankReadClient,
} from './SafeBankDataProvider'

const ACCOUNT =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const readClient: SafeBankReadClient = {
  provider: {
    name: 'mock-provider',
  },
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

function createDashboardData(
  account: string | null,
): SafeBankDashboardData {
  return {
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
    ownedDeposits: [],
    pendingInterestClaims: [],
    protocolStatus: {
      planCount: 1n,
      depositCount: 0n,
      savingCorePaused: false,
      vaultManagerPaused: false,
      totalReservedInterest: 0n,
      gracePeriodSeconds: 172_800n,
      bpsDenominator: 10_000n,
      latestBlockTimestamp:
        1_700_000_000n,
    },
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
            balance: 5_000_000_000n,
            allowance: 100_000_000n,
          },
  }
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
          'Signer is not used by data-provider tests.',
        )
      },
    ),
    clearError: vi.fn(),
  }
}

function DataProbe() {
  const safeBank = useSafeBankData()

  return (
    <div>
      <output data-testid="data-status">
        {safeBank.status}
      </output>

      <output data-testid="data-error">
        {safeBank.error ?? 'none'}
      </output>

      <output data-testid="plan-count">
        {safeBank.data?.plans.length ?? 0}
      </output>

      <output data-testid="token-balance">
        {safeBank.data?.tokenAccountState
          ?.balance.toString() ?? 'none'}
      </output>

      <button
        type="button"
        onClick={() => {
          void safeBank.refresh()
        }}
      >
        Refresh data
      </button>
    </div>
  )
}

function createTree(
  account: string | null,
  loader: SafeBankDashboardLoader,
) {
  return (
    <WalletContext.Provider
      value={createWalletValue(account)}
    >
      <SafeBankDataProvider
        readClient={readClient}
        loader={loader}
      >
        <DataProbe />
      </SafeBankDataProvider>
    </WalletContext.Provider>
  )
}

describe('SafeBankDataProvider', () => {
  it('loads public data for a disconnected wallet', async () => {
    const loader = vi.fn(
      async ({
        account,
      }: LoadSafeBankDashboardArguments) =>
        createDashboardData(account),
    )

    render(createTree(null, loader))

    expect(
      await screen.findByTestId('data-status'),
    ).toHaveTextContent('ready')

    expect(
      screen.getByTestId('plan-count'),
    ).toHaveTextContent('1')

    expect(
      screen.getByTestId('token-balance'),
    ).toHaveTextContent('none')

    expect(loader).toHaveBeenCalledWith({
      provider: readClient.provider,
      contracts: readClient.contracts,
      account: null,
    })
  })

  it('loads wallet-specific state for a connected account', async () => {
    const loader = vi.fn(
      async ({
        account,
      }: LoadSafeBankDashboardArguments) =>
        createDashboardData(account),
    )

    render(createTree(ACCOUNT, loader))

    expect(
      await screen.findByTestId('data-status'),
    ).toHaveTextContent('ready')

    expect(
      screen.getByTestId('token-balance'),
    ).toHaveTextContent('5000000000')

    expect(loader).toHaveBeenCalledWith(
      expect.objectContaining({
        account: ACCOUNT,
      }),
    )
  })

  it('reloads data when the wallet account changes', async () => {
    const loader = vi.fn(
      async ({
        account,
      }: LoadSafeBankDashboardArguments) =>
        createDashboardData(account),
    )

    const view = render(
      createTree(null, loader),
    )

    await waitFor(() => {
      expect(loader).toHaveBeenCalledTimes(1)
    })

    view.rerender(
      createTree(ACCOUNT, loader),
    )

    await waitFor(() => {
      expect(loader).toHaveBeenCalledTimes(2)
    })

    expect(loader).toHaveBeenLastCalledWith(
      expect.objectContaining({
        account: ACCOUNT,
      }),
    )

    expect(
      screen.getByTestId('token-balance'),
    ).toHaveTextContent('5000000000')
  })

  it('supports manual refresh and exposes read failures', async () => {
    const user = userEvent.setup()

    const loader = vi
      .fn<SafeBankDashboardLoader>()
      .mockResolvedValueOnce(
        createDashboardData(null),
      )
      .mockRejectedValueOnce(
        new Error('Sepolia RPC unavailable'),
      )

    render(createTree(null, loader))

    expect(
      await screen.findByTestId('data-status'),
    ).toHaveTextContent('ready')

    await user.click(
      screen.getByRole('button', {
        name: 'Refresh data',
      }),
    )

    await waitFor(() => {
      expect(
        screen.getByTestId('data-status'),
      ).toHaveTextContent('error')
    })

    expect(
      screen.getByTestId('data-error'),
    ).toHaveTextContent(
      'Sepolia RPC unavailable',
    )

    expect(loader).toHaveBeenCalledTimes(2)
  })
})
