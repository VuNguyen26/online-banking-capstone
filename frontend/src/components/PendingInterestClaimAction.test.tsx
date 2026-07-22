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

import type {
  PendingInterestState,
} from '../contracts/models'
import type {
  SafeBankDataContextValue,
} from '../providers/safebank-data-context'
import type {
  WalletContextValue,
} from '../providers/wallet-context'
import {
  PendingInterestClaimAction,
  type CreatePendingInterestClaimContracts,
} from './PendingInterestClaimAction'

const ACCOUNT =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const OTHER_ACCOUNT =
  '0x1111111111111111111111111111111111111111'

const TRANSACTION_HASH =
  `0x${'f'.repeat(64)}`

const CLAIM:
  PendingInterestState = {
    depositId: 9n,
    amount: 8_000_000n,
    claimant: ACCOUNT,
  }

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

function createSafeBank():
  SafeBankDataContextValue {
  return {
    status: 'ready',
    error: null,
    data: null,
    refresh: vi.fn(
      async () => undefined,
    ),
  }
}

function createTransaction() {
  return {
    hash: TRANSACTION_HASH,
    wait: vi.fn(
      async () => ({
        status: 1,
      }),
    ),
  }
}

describe('PendingInterestClaimAction', () => {
  it('claims the exact deposit and refreshes after confirmation', async () => {
    const user = userEvent.setup()
    const safeBank =
      createSafeBank()

    const claimPendingInterest =
      vi.fn(
        async () =>
          createTransaction(),
      )

    const createWriteContracts:
      CreatePendingInterestClaimContracts =
      vi.fn(() => ({
        savingCore: {
          claimPendingInterest,
        },
      }))

    render(
      <PendingInterestClaimAction
        wallet={createWallet()}
        safeBank={safeBank}
        claim={CLAIM}
        savingCorePaused={false}
        createWriteContracts={
          createWriteContracts
        }
      />,
    )

    await user.click(
      screen.getByRole('button', {
        name:
          'Nhận lãi đang chờ của khoản gửi 9',
      }),
    )

    await waitFor(() => {
      expect(
        screen.getByText(
          'Đã nhận lãi hoãn trả thành công.',
        ),
      ).toBeInTheDocument()
    })

    expect(
      claimPendingInterest,
    ).toHaveBeenCalledWith(9n)

    expect(
      safeBank.refresh,
    ).toHaveBeenCalledTimes(1)
  })

  it('disables claiming on the wrong network', () => {
    render(
      <PendingInterestClaimAction
        wallet={createWallet({
          chainId: 31_337n,
          isSepolia: false,
        })}
        safeBank={createSafeBank()}
        claim={CLAIM}
        savingCorePaused={false}
      />,
    )

    expect(
      screen.getByRole('button', {
        name:
          'Nhận lãi đang chờ của khoản gửi 9',
      }),
    ).toBeDisabled()

    expect(
      screen.getByText(
        /Chuyển ví sang Ethereum Sepolia trước khi nhận khoản lãi này/,
      ),
    ).toBeInTheDocument()
  })

  it('disables claiming while SavingCore is paused', () => {
    render(
      <PendingInterestClaimAction
        wallet={createWallet()}
        safeBank={createSafeBank()}
        claim={CLAIM}
        savingCorePaused
      />,
    )

    expect(
      screen.getByRole('button', {
        name:
          'Nhận lãi đang chờ của khoản gửi 9',
      }),
    ).toBeDisabled()

    expect(
      screen.getByText(
        /Các thao tác nhận lãi hoãn trả tạm thời không khả dụng/,
      ),
    ).toBeInTheDocument()
  })

  it('renders no action when the connected account is not the claimant', () => {
    const { container } = render(
      <PendingInterestClaimAction
        wallet={createWallet()}
        safeBank={createSafeBank()}
        claim={{
          ...CLAIM,
          claimant:
            OTHER_ACCOUNT,
        }}
        savingCorePaused={false}
      />,
    )

    expect(
      container,
    ).toBeEmptyDOMElement()
  })

  it('shows wallet rejection and does not refresh', async () => {
    const user = userEvent.setup()
    const safeBank =
      createSafeBank()

    const claimPendingInterest =
      vi.fn(async () => {
        throw {
          code: 4001,
          message: 'User rejected',
        }
      })

    render(
      <PendingInterestClaimAction
        wallet={createWallet()}
        safeBank={safeBank}
        claim={CLAIM}
        savingCorePaused={false}
        createWriteContracts={() => ({
          savingCore: {
            claimPendingInterest,
          },
        })}
      />,
    )

    await user.click(
      screen.getByRole('button', {
        name:
          'Nhận lãi đang chờ của khoản gửi 9',
      }),
    )

    await waitFor(() => {
      expect(
        screen.getByRole('alert'),
      ).toHaveTextContent(
        'Bạn đã từ chối giao dị trong ví.',
      )
    })

    expect(
      safeBank.refresh,
    ).not.toHaveBeenCalled()
  })
})
