import type {
  JsonRpcSigner,
} from 'ethers'
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

import {
  LanguageProvider,
} from '../i18n/LanguageProvider'
import type {
  WalletContextValue,
} from '../providers/wallet-context'
import {
  AdminVaultWithdrawAction,
} from './AdminVaultWithdrawAction'

const ACCOUNT =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const HASH =
  `0x${'c'.repeat(64)}`

function createWallet():
  WalletContextValue {
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
  }
}

describe('AdminVaultWithdrawAction', () => {
  beforeEach(() => {
    localStorage.setItem(
      'safebank.language',
      'en',
    )
  })

  it('withdraws an exact amount within available liquidity', async () => {
    const user = userEvent.setup()

    const withdrawVault = vi.fn(
      async () => ({
        hash: HASH,
        wait: async () => ({
          status: 1,
        }),
      }),
    )

    const refresh = vi.fn(
      async () => undefined,
    )

    render(
      <LanguageProvider>
        <AdminVaultWithdrawAction
          wallet={createWallet()}
          isVaultManagerOwner
          vaultManagerOwner={ACCOUNT}
          vaultPaused={false}
          availableLiquidity={
            500_000_000n
          }
          refresh={refresh}
          createWriteContracts={() => ({
            vaultManager: {
              withdrawVault,
            },
          })}
        />
      </LanguageProvider>,
    )

    await user.type(
      screen.getByLabelText(
        'Withdrawal amount (mUSDC)',
      ),
      '125',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Withdraw available liquidity',
      }),
    )

    const dialog = screen.getByRole(
      'dialog',
      {
        name:
          'Confirm VaultManager withdrawal',
      },
    )

    expect(dialog).toHaveTextContent(
      '125 mUSDC',
    )
    expect(dialog).toHaveTextContent(
      '500 mUSDC',
    )
    expect(dialog).toHaveTextContent(
      '375 mUSDC',
    )
    expect(dialog).toHaveTextContent(
      ACCOUNT,
    )

    expect(
      withdrawVault,
    ).not.toHaveBeenCalled()

    expect(refresh).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', {
        name: 'Continue to wallet',
      }),
    )

    expect(
      withdrawVault,
    ).toHaveBeenCalledWith(
      125_000_000n,
    )

    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('blocks amounts above available liquidity', async () => {
    const user = userEvent.setup()

    render(
      <LanguageProvider>
        <AdminVaultWithdrawAction
          wallet={createWallet()}
          isVaultManagerOwner
          vaultManagerOwner={ACCOUNT}
          vaultPaused={false}
          availableLiquidity={
            100_000_000n
          }
          refresh={vi.fn()}
        />
      </LanguageProvider>,
    )

    await user.type(
      screen.getByLabelText(
        'Withdrawal amount (mUSDC)',
      ),
      '125',
    )

    expect(
      screen.getByRole('button', {
        name: 'Withdraw available liquidity',
      }),
    ).toBeDisabled()

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'Withdrawal cannot exceed available liquidity.',
    )
  })

  it('blocks withdrawal while VaultManager is paused', () => {
    render(
      <LanguageProvider>
        <AdminVaultWithdrawAction
          wallet={createWallet()}
          isVaultManagerOwner
          vaultManagerOwner={ACCOUNT}
          vaultPaused
          availableLiquidity={
            500_000_000n
          }
          refresh={vi.fn()}
        />
      </LanguageProvider>,
    )

    expect(
      screen.getByRole('button', {
        name: 'Withdraw available liquidity',
      }),
    ).toBeDisabled()

    expect(
      screen.getByText(
        'Unpause VaultManager before withdrawing liquidity.',
      ),
    ).toBeInTheDocument()
  })
})