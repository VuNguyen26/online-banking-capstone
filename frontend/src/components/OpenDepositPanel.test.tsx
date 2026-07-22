import {
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {
  JsonRpcSigner,
} from 'ethers'
import { vi } from 'vitest'

import {
  SAFE_BANK_DEPLOYMENT,
} from '../contracts/generated/contracts'
import type {
  SafeBankDataContextValue,
} from '../providers/safebank-data-context'
import type {
  WalletContextValue,
} from '../providers/wallet-context'
import {
  OpenDepositPanel,
  type CreateOpenDepositWriteContracts,
} from './OpenDepositPanel'

const ACCOUNT =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const TRANSACTION_HASH =
  `0x${'c'.repeat(64)}`

function createWallet(
  overrides: Partial<WalletContextValue> = {},
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

function createSafeBank(
  allowance: bigint,
  balance = 1_000_000_000n,
): SafeBankDataContextValue {
  return {
    status: 'ready',
    error: null,
    refresh: vi.fn(
      async () => undefined,
    ),
    data: {
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
      tokenAccountState: {
        balance,
        allowance,
      },
    },
  }
}

function createTransaction() {
  return {
    hash: TRANSACTION_HASH,
    wait: vi.fn(async () => ({
      status: 1,
    })),
  }
}

describe('OpenDepositPanel', () => {
  it('disables writes when the wallet is disconnected or on the wrong network', async () => {
    const view = render(
      <OpenDepositPanel
        wallet={createWallet({
          status: 'disconnected',
          account: null,
          isConnected: false,
        })}
        safeBank={createSafeBank(0n)}
      />,
    )

    const amountInput =
      screen.getByLabelText(
        'Số tiền gửi',
      )

    await userEvent.type(
      amountInput,
      '500',
    )

    expect(
      screen.getByRole('button', {
        name: 'Phê duyệt đúng số lượng mUSDC',
      }),
    ).toBeDisabled()

    view.rerender(
      <OpenDepositPanel
        wallet={createWallet({
          chainId: 31_337n,
          isSepolia: false,
        })}
        safeBank={createSafeBank(0n)}
      />,
    )

    expect(
      screen.getByText(
        'Chuyển ví sang Ethereum Sepolia trước khi gửi giao dịch.',
      ),
    ).toBeInTheDocument()
  })

  it('shows deterministic amount validation and no auto-renew input', async () => {
    const user = userEvent.setup()

    render(
      <OpenDepositPanel
        wallet={createWallet()}
        safeBank={createSafeBank(
          1_000_000_000n,
        )}
      />,
    )

    const amountInput =
      screen.getByLabelText(
        'Số tiền gửi',
      )

    await user.type(
      amountInput,
      '99',
    )

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'thấp hơn mức gửi tối thiểu',
    )

    expect(
      screen.queryByRole('checkbox'),
    ).not.toBeInTheDocument()
  })

  it('approves only the exact entered amount for SavingCore', async () => {
    const user = userEvent.setup()
    const transaction =
      createTransaction()
    const approve = vi.fn(
      async () => transaction,
    )

    const createWriteContracts:
      CreateOpenDepositWriteContracts =
      vi.fn(() => ({
        mockUsdc: {
          approve,
        },
        savingCore: {},
      }))

    const safeBank =
      createSafeBank(0n)

    render(
      <OpenDepositPanel
        wallet={createWallet()}
        safeBank={safeBank}
        createWriteContracts={
          createWriteContracts
        }
      />,
    )

    await user.type(
      screen.getByLabelText(
        'Số tiền gửi',
      ),
      '500',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Phê duyệt đúng số lượng mUSDC',
      }),
    )

    await waitFor(() => {
      expect(
        screen.getByText(
          'Giao dịch đã được xác nhận.',
        ),
      ).toBeInTheDocument()
    })

    expect(approve).toHaveBeenCalledWith(
      SAFE_BANK_DEPLOYMENT.contracts
        .SavingCore.address,
      500_000_000n,
    )

    expect(
      safeBank.refresh,
    ).toHaveBeenCalledTimes(1)
  })

  it('opens the selected plan when allowance is sufficient', async () => {
    const user = userEvent.setup()
    const transaction =
      createTransaction()
    const openDeposit = vi.fn(
      async () => transaction,
    )

    const createWriteContracts:
      CreateOpenDepositWriteContracts =
      vi.fn(() => ({
        mockUsdc: {},
        savingCore: {
          openDeposit,
        },
      }))

    const safeBank =
      createSafeBank(
        1_000_000_000n,
      )

    render(
      <OpenDepositPanel
        wallet={createWallet()}
        safeBank={safeBank}
        createWriteContracts={
          createWriteContracts
        }
      />,
    )

    await user.type(
      screen.getByLabelText(
        'Số tiền gửi',
      ),
      '500',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Mở khoản gửi',
      }),
    )

    const depositReviewDialog =
      screen.getByRole('dialog')

    expect(
      depositReviewDialog,
    ).toHaveTextContent('#1')
    expect(
      depositReviewDialog,
    ).toHaveTextContent('500 mUSDC')
    expect(
      depositReviewDialog,
    ).toHaveTextContent('180 ngày')
    expect(
      depositReviewDialog,
    ).toHaveTextContent('2%')
    expect(
      depositReviewDialog,
    ).toHaveTextContent('7.5%')

    expect(
      openDeposit,
    ).not.toHaveBeenCalled()

    expect(
      safeBank.refresh,
    ).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', {
        name: /tiếp tục đến ví/i,
      }),
    )

    await waitFor(() => {
      expect(
        screen.getByText(
          'Giao dịch đã được xác nhận.',
        ),
      ).toBeInTheDocument()
    })

    expect(
      openDeposit,
    ).toHaveBeenCalledWith(
      1n,
      500_000_000n,
    )

    expect(
      safeBank.refresh,
    ).toHaveBeenCalledTimes(1)

    expect(
      screen.getByLabelText(
        'Số tiền gửi',
      ),
    ).toHaveValue('')
  })

  it('blocks deposit opening when wallet balance is insufficient', async () => {
    const user = userEvent.setup()

    render(
      <OpenDepositPanel
        wallet={createWallet()}
        safeBank={createSafeBank(
          1_000_000_000n,
          400_000_000n,
        )}
      />,
    )

    await user.type(
      screen.getByLabelText(
        'Số tiền gửi',
      ),
      '500',
    )

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'không có đủ mUSDC',
    )

    expect(
      screen.getByRole('button', {
        name: 'Mở khoản gửi',
      }),
    ).toBeDisabled()
  })

  it('clarifies empty amount and zero-balance states', () => {
    render(
      <OpenDepositPanel
        wallet={createWallet()}
        safeBank={createSafeBank(0n, 0n)}
      />,
    )

    expect(
      screen.getByLabelText('Số tiền gửi'),
    ).toHaveAttribute(
      'placeholder',
      'Ví dụ: 500',
    )

    expect(
      screen.getByText(
        'Nhập số tiền để xem lãi ước tính.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        /Số dư mUSDC của ví đang bằng 0/,
      ),
    ).toBeInTheDocument()
  })
})
