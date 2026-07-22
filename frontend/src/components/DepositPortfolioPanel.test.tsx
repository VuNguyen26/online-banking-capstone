import {
  render,
  screen,
} from '@testing-library/react'
import type {
  JsonRpcSigner,
} from 'ethers'
import { vi } from 'vitest'

import type {
  DepositRecord,
  PendingInterestState,
} from '../contracts/models'
import {
  DEPOSIT_STATUS,
} from '../lib/deposits'
import type {
  SafeBankDataContextValue,
} from '../providers/safebank-data-context'
import type {
  WalletContextValue,
} from '../providers/wallet-context'
import {
  DepositPortfolioPanel,
} from './DepositPortfolioPanel'

const ACCOUNT =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const MATURITY_AT =
  1_700_000_000n

const GRACE_PERIOD =
  172_800n

function createWallet(
  overrides:
    Partial<WalletContextValue> = {},
): WalletContextValue {
  return {
    status: 'connected',
    walletAvailable: true,
    account: ACCOUNT,
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
      async () =>
        ({} as JsonRpcSigner),
    ),
    clearError: vi.fn(),
    ...overrides,
  }
}

function createDeposit(
  overrides:
    Partial<DepositRecord> = {},
): DepositRecord {
  return {
    depositId: 7n,
    planId: 1n,
    principal: 500_000_000n,
    startedAt: 1_690_000_000n,
    maturityAt: MATURITY_AT,
    tenorDays: 180n,
    aprBpsAtOpen: 200n,
    penaltyBpsAtOpen: 750n,
    status:
      DEPOSIT_STATUS.Active,
    ...overrides,
  }
}

function createClaim(
  overrides:
    Partial<PendingInterestState> = {},
): PendingInterestState {
  return {
    depositId: 9n,
    amount: 8_000_000n,
    claimant: ACCOUNT,
    ...overrides,
  }
}

function createSafeBank(
  options: {
    deposits?: DepositRecord[]
    claims?: PendingInterestState[]
    timestamp?: bigint
    paused?: boolean
  } = {},
): SafeBankDataContextValue {
  return {
    status: 'ready',
    error: null,
    refresh: vi.fn(
      async () => undefined,
    ),
    data: {
      plans: [],
      ownedDeposits:
        options.deposits ?? [],
      pendingInterestClaims:
        options.claims ?? [],
      protocolStatus: {
        planCount: 1n,
        depositCount: 1n,
        savingCorePaused:
          options.paused ?? false,
        vaultManagerPaused: false,
        totalReservedInterest: 0n,
        gracePeriodSeconds:
          GRACE_PERIOD,
        bpsDenominator: 10_000n,
        latestBlockTimestamp:
          options.timestamp ??
          MATURITY_AT - 1n,
      },
      vaultMetrics: {
        vaultBalance: 0n,
        totalReservedInterest: 0n,
        availableLiquidity: 0n,
        fundingShortfall: 0n,
      },
      tokenAccountState: {
        balance: 0n,
        allowance: 0n,
      },
    },
  }
}

describe('DepositPortfolioPanel', () => {
  it('requires a connected wallet before showing wallet-specific data', () => {
    render(
      <DepositPortfolioPanel
        wallet={createWallet({
          status: 'disconnected',
          account: null,
          isConnected: false,
        })}
        safeBank={createSafeBank({
          deposits: [
            createDeposit(),
          ],
        })}
      />,
    )

    expect(
      screen.getByText(
        /K\u1ebft n\u1ed1i v\u00ed \u0111\u1ec3 xem ch\u1ee9ng ch\u1ec9 ti\u1ec1n g\u1eedi/,
      ),
    ).toBeInTheDocument()

    expect(
      screen.queryByLabelText(
        'Chứng chỉ tiền gửi 7',
      ),
    ).not.toBeInTheDocument()
  })

  it('renders clear empty states for deposits and C1 claims', () => {
    render(
      <DepositPortfolioPanel
        wallet={createWallet()}
        safeBank={createSafeBank()}
      />,
    )

    expect(
      screen.getByText(
        /kh\u00f4ng s\u1edf h\u1eefu ch\u1ee9ng ch\u1ec9 ti\u1ec1n g\u1eedi SafeBank n\u00e0o/,
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        /Không có khoản lãi hoãn trả chưa thanh toán/,
      ),
    ).toBeInTheDocument()
  })

  it('shows early withdrawal before maturity using the Sepolia timestamp', () => {
    render(
      <DepositPortfolioPanel
        wallet={createWallet()}
        safeBank={createSafeBank({
          deposits: [
            createDeposit(),
          ],
          timestamp:
            MATURITY_AT - 1n,
        })}
      />,
    )

    const card =
      screen.getByLabelText(
        'Chứng chỉ tiền gửi 7',
      )

    expect(card).toHaveTextContent(
      '500 mUSDC',
    )

    expect(card).toHaveTextContent(
      'Rút trước hạn',
    )

    expect(card).not.toHaveTextContent(
      'Tái tục thủ công',
    )

    expect(card).toHaveTextContent(
      'UTC',
    )
  })

  it('shows maturity withdrawal and manual renewal at exact maturity', () => {
    render(
      <DepositPortfolioPanel
        wallet={createWallet()}
        safeBank={createSafeBank({
          deposits: [
            createDeposit(),
          ],
          timestamp:
            MATURITY_AT,
        })}
      />,
    )

    const card =
      screen.getByLabelText(
        'Chứng chỉ tiền gửi 7',
      )

    expect(card).toHaveTextContent(
      'Rút khi đáo hạn',
    )

    expect(card).toHaveTextContent(
      'Tái tục thủ công',
    )

    expect(card).not.toHaveTextContent(
      'Tái tục tự động',
    )
  })

  it('shows auto-renewal at exact grace end', () => {
    render(
      <DepositPortfolioPanel
        wallet={createWallet()}
        safeBank={createSafeBank({
          deposits: [
            createDeposit(),
          ],
          timestamp:
            MATURITY_AT +
            GRACE_PERIOD,
        })}
      />,
    )

    const card =
      screen.getByLabelText(
        'Chứng chỉ tiền gửi 7',
      )

    expect(card).toHaveTextContent(
      'Rút khi đáo hạn',
    )

    expect(card).toHaveTextContent(
      'Tái tục tự động',
    )

    expect(card).not.toHaveTextContent(
      'Tái tục thủ công',
    )
  })

  it('renders C1 claims independently and marks actions unavailable while paused', () => {
    render(
      <DepositPortfolioPanel
        wallet={createWallet()}
        safeBank={createSafeBank({
          deposits: [
            createDeposit(),
          ],
          claims: [
            createClaim(),
          ],
          paused: true,
        })}
      />,
    )

    expect(
      screen.getByLabelText(
        'Lãi hoãn trả của khoản gửi 9',
      ),
    ).toHaveTextContent(
      '8 mUSDC đang chờ',
    )

    expect(
      screen.getByText(
        'Chưa thể nhận',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByLabelText(
        'Chứng chỉ tiền gửi 7',
      ),
    ).toHaveTextContent(
      'Hiện không có thao tác vòng đời nào khả dụng.',
    )
  })

  it('handles a ready context with missing dashboard data safely', () => {
    render(
      <DepositPortfolioPanel
        wallet={createWallet()}
        safeBank={{
          status: 'ready',
          error: null,
          data: null,
          refresh: vi.fn(
            async () => undefined,
          ),
        }}
      />,
    )

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'Dữ liệu danh mục hiện không khả dụng.',
    )
  })

})
