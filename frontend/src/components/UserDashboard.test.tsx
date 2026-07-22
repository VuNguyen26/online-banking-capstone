import {
  render,
  screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { JsonRpcSigner } from 'ethers'
import { vi } from 'vitest'

import type {
  SafeBankDashboardData,
} from '../contracts/dashboard'
import type {
  SafeBankDataContextValue,
} from '../providers/safebank-data-context'
import type {
  WalletContextValue,
} from '../providers/wallet-context'
import { UserDashboard } from './UserDashboard'

const ACCOUNT =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

function createWallet(
  overrides: Partial<WalletContextValue> = {},
): WalletContextValue {
  return {
    status: 'disconnected',
    walletAvailable: true,
    account: null,
    chainId: 11_155_111n,
    isConnected: false,
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
        throw new Error('Not used in UI tests.')
      },
    ),
    clearError: vi.fn(),
    ...overrides,
  }
}

function createReadyData(
  overrides: Partial<SafeBankDashboardData> = {},
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
    tokenAccountState: null,
    ...overrides,
  }
}

function createSafeBank(
  overrides:
    Partial<SafeBankDataContextValue> = {},
): SafeBankDataContextValue {
  return {
    status: 'ready',
    data: createReadyData(),
    error: null,
    refresh: vi.fn(
      async () => undefined,
    ),
    ...overrides,
  }
}

describe('UserDashboard', () => {
  it('shows a testnet disclaimer and unavailable-wallet state', () => {
    render(
      <UserDashboard
        wallet={createWallet({
          status: 'unavailable',
          walletAvailable: false,
        })}
        safeBank={createSafeBank()}
      />,
    )

    expect(
      screen.getByLabelText('Testnet notice'),
    ).toHaveTextContent(
      'mUSDC v\u00e0 Sepolia ETH kh\u00f4ng c\u00f3 gi\u00e1 tr\u1ecb th\u1ef1c',
    )

    expect(
      screen.getByText(
        'Không phát hiện ví trình duyệt',
      ),
    ).toBeInTheDocument()
  })

  it('connects only after the user selects the wallet button', async () => {
    const user = userEvent.setup()
    const connectWallet = vi.fn(
      async () => undefined,
    )

    render(
      <UserDashboard
        wallet={createWallet({
          connectWallet,
        })}
        safeBank={createSafeBank()}
      />,
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Kết nối ví',
      }),
    )

    expect(connectWallet).toHaveBeenCalledTimes(1)
  })

  it('shows the wrong-network guard and switch action', async () => {
    const user = userEvent.setup()
    const switchToSepolia = vi.fn(
      async () => undefined,
    )

    render(
      <UserDashboard
        wallet={createWallet({
          status: 'connected',
          account: ACCOUNT,
          isConnected: true,
          chainId: 31_337n,
          isSepolia: false,
          switchToSepolia,
        })}
        safeBank={createSafeBank()}
      />,
    )

    expect(
      screen.getByText('Sai mạng'),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', {
        name: 'Chuyển sang Sepolia',
      }),
    )

    expect(
      switchToSepolia,
    ).toHaveBeenCalledTimes(1)
  })

  it('renders loading and read-error states with retry', async () => {
    const user = userEvent.setup()
    const refresh = vi.fn(
      async () => undefined,
    )

    const view = render(
      <UserDashboard
        wallet={createWallet()}
        safeBank={createSafeBank({
          status: 'loading',
          data: null,
        })}
      />,
    )

    expect(
      screen.getByText(
        'Đang tải trạng thái Sepolia',
      ),
    ).toBeInTheDocument()

    view.rerender(
      <UserDashboard
        wallet={createWallet()}
        safeBank={createSafeBank({
          status: 'error',
          data: null,
          error: 'Sepolia RPC unavailable',
          refresh,
        })}
      />,
    )

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'Sepolia RPC unavailable',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Thử tải lại dữ liệu',
      }),
    )

    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('renders plan, account and C2 metrics from ready data', () => {
    render(
      <UserDashboard
        wallet={createWallet({
          status: 'connected',
          account: ACCOUNT,
          isConnected: true,
        })}
        safeBank={createSafeBank({
          data: createReadyData({
            tokenAccountState: {
              balance: 5_000_000_000n,
              allowance: 100_000_000n,
            },
          }),
        })}
      />,
    )

    expect(
      screen.getByText('Kỳ hạn 180 ngày'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('2%'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('5000 mUSDC'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('100 mUSDC'),
    ).toBeInTheDocument()

    expect(
      screen.getAllByText('0 mUSDC'),
    ).toHaveLength(4)

    expect(
      screen.getByRole('link', {
        name: 'Xem SavingCore trên Etherscan',
      }),
    ).toHaveAttribute(
      'href',
      expect.stringContaining(
        'a35c55e7E2dB5874699cC9fb8d0E25032f51b443',
      ),
    )
  })

  it('renders empty plans and an underfunded warning', () => {
    render(
      <UserDashboard
        wallet={createWallet()}
        safeBank={createSafeBank({
          data: createReadyData({
            plans: [],
            vaultMetrics: {
              vaultBalance: 0n,
              totalReservedInterest:
                1_000_000n,
              availableLiquidity: 0n,
              fundingShortfall:
                1_000_000n,
            },
          }),
        })}
      />,
    )

    expect(
      screen.getByText(
        'Hiện không có gói tiết kiệm nào khả dụng.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Kho lãi chưa đủ vốn',
      ),
    ).toBeInTheDocument()
  })
})
