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
  AdminProtocolPauseAction,
} from './AdminProtocolPauseAction'

const OWNER =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const HASH =
  `0x${'e'.repeat(64)}`

function createWallet():
  WalletContextValue {
  return {
    status: 'connected',
    walletAvailable: true,
    account: OWNER,
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

function transaction() {
  return {
    hash: HASH,
    wait: async () => ({
      status: 1,
    }),
  }
}

describe('AdminProtocolPauseAction', () => {
  beforeEach(() => {
    localStorage.setItem(
      'safebank.language',
      'en',
    )
  })

  it('pauses SavingCore and refreshes data', async () => {
    const user = userEvent.setup()

    const pause = vi.fn(
      async () => transaction(),
    )

    const refresh = vi.fn(
      async () => undefined,
    )

    render(
      <LanguageProvider>
        <AdminProtocolPauseAction
          target="saving-core"
          paused={false}
          isOwner
          wallet={createWallet()}
          refresh={refresh}
          createWriteContracts={() => ({
            savingCore: { pause },
            vaultManager: {},
          })}
        />
      </LanguageProvider>,
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Pause contract',
      }),
    )

    const dialog = screen.getByRole(
      'dialog',
      {
        name: 'Confirm contract pause',
      },
    )

    expect(dialog).toHaveTextContent(
      'New deposits and financial actions through SavingCore will be temporarily unavailable',
    )
    expect(dialog).toHaveTextContent(
      'SavingCore',
    )
    expect(dialog).toHaveTextContent(
      'Active',
    )
    expect(dialog).toHaveTextContent(
      'Paused',
    )

    expect(pause).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', {
        name: 'Continue to wallet',
      }),
    )

    expect(pause).toHaveBeenCalledTimes(1)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('unpauses VaultManager independently', async () => {
    const user = userEvent.setup()

    const unpause = vi.fn(
      async () => transaction(),
    )

    render(
      <LanguageProvider>
        <AdminProtocolPauseAction
          target="vault-manager"
          paused
          isOwner
          wallet={createWallet()}
          refresh={vi.fn()}
          createWriteContracts={() => ({
            savingCore: {},
            vaultManager: { unpause },
          })}
        />
      </LanguageProvider>,
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Unpause contract',
      }),
    )

    expect(unpause).toHaveBeenCalledTimes(1)
  })

  it('blocks a non-owner wallet', () => {
    render(
      <LanguageProvider>
        <AdminProtocolPauseAction
          target="saving-core"
          paused={false}
          isOwner={false}
          wallet={createWallet()}
          refresh={vi.fn()}
        />
      </LanguageProvider>,
    )

    expect(
      screen.getByRole('button', {
        name: 'Pause contract',
      }),
    ).toBeDisabled()

    expect(
      screen.getByText(
        'Only the SavingCore owner can perform this action.',
      ),
    ).toBeInTheDocument()
  })
})