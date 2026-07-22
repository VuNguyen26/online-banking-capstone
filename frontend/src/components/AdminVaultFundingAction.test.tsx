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
  SAFE_BANK_DEPLOYMENT,
} from '../contracts/generated/contracts'
import {
  LanguageProvider,
} from '../i18n/LanguageProvider'
import type {
  WalletContextValue,
} from '../providers/wallet-context'
import {
  AdminVaultFundingAction,
} from './AdminVaultFundingAction'

const ACCOUNT =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const HASH =
  `0x${'b'.repeat(64)}`

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

function createTransaction() {
  return {
    hash: HASH,
    wait: async () => ({
      status: 1,
    }),
  }
}

describe('AdminVaultFundingAction', () => {
  beforeEach(() => {
    localStorage.setItem(
      'safebank.language',
      'en',
    )
  })

  it('approves the exact funding amount when allowance is insufficient', async () => {
    const user = userEvent.setup()

    const approve = vi.fn(
      async () =>
        createTransaction(),
    )

    const refresh = vi.fn(
      async () => undefined,
    )

    render(
      <LanguageProvider>
        <AdminVaultFundingAction
          wallet={createWallet()}
          isVaultManagerOwner
          tokenBalance={
            1_000_000_000n
          }
          vaultAllowance={0n}
          refresh={refresh}
          createWriteContracts={() => ({
            mockUsdc: {
              approve,
            },
            vaultManager: {},
          })}
        />
      </LanguageProvider>,
    )

    await user.type(
      screen.getByLabelText(
        'Funding amount (mUSDC)',
      ),
      '250',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Approve exact amount',
      }),
    )

    expect(approve).toHaveBeenCalledWith(
      SAFE_BANK_DEPLOYMENT.contracts
        .VaultManager.address,
      250_000_000n,
    )

    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('funds VaultManager when allowance already covers the amount', async () => {
    const user = userEvent.setup()

    const fundVault = vi.fn(
      async () =>
        createTransaction(),
    )

    const refresh = vi.fn(
      async () => undefined,
    )

    render(
      <LanguageProvider>
        <AdminVaultFundingAction
          wallet={createWallet()}
          isVaultManagerOwner
          tokenBalance={
            1_000_000_000n
          }
          vaultAllowance={
            500_000_000n
          }
          refresh={refresh}
          createWriteContracts={() => ({
            mockUsdc: {},
            vaultManager: {
              fundVault,
            },
          })}
        />
      </LanguageProvider>,
    )

    await user.type(
      screen.getByLabelText(
        'Funding amount (mUSDC)',
      ),
      '250',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Fund VaultManager',
      }),
    )

    expect(
      fundVault,
    ).toHaveBeenCalledWith(
      250_000_000n,
    )

    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('blocks funding above the connected wallet balance', async () => {
    const user = userEvent.setup()

    render(
      <LanguageProvider>
        <AdminVaultFundingAction
          wallet={createWallet()}
          isVaultManagerOwner
          tokenBalance={
            100_000_000n
          }
          vaultAllowance={
            500_000_000n
          }
          refresh={vi.fn()}
        />
      </LanguageProvider>,
    )

    await user.type(
      screen.getByLabelText(
        'Funding amount (mUSDC)',
      ),
      '250',
    )

    expect(
      screen.getByRole('button', {
        name: 'Fund VaultManager',
      }),
    ).toBeDisabled()

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'The connected wallet does not have enough mUSDC.',
    )
  })
})