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
  AdminFeeReceiverAction,
} from './AdminFeeReceiverAction'

const OWNER =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const NEW_RECEIVER =
  '0x1111111111111111111111111111111111111111'

const HASH =
  `0x${'d'.repeat(64)}`

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

describe('AdminFeeReceiverAction', () => {
  beforeEach(() => {
    localStorage.setItem(
      'safebank.language',
      'en',
    )
  })

  it('updates the fee receiver and refreshes data', async () => {
    const user = userEvent.setup()

    const setFeeReceiver = vi.fn(
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
        <AdminFeeReceiverAction
          wallet={createWallet()}
          isVaultManagerOwner
          currentFeeReceiver={OWNER}
          refresh={refresh}
          createWriteContracts={() => ({
            vaultManager: {
              setFeeReceiver,
            },
          })}
        />
      </LanguageProvider>,
    )

    const input =
      screen.getByLabelText(
        'New fee receiver',
      )

    await user.clear(input)
    await user.type(
      input,
      NEW_RECEIVER,
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Update fee receiver',
      }),
    )

    const dialog = screen.getByRole(
      'dialog',
      {
        name:
          'Confirm fee receiver update',
      },
    )

    expect(dialog).toHaveTextContent(
      OWNER,
    )
    expect(dialog).toHaveTextContent(
      NEW_RECEIVER,
    )

    expect(
      setFeeReceiver,
    ).not.toHaveBeenCalled()

    expect(refresh).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', {
        name: 'Continue to wallet',
      }),
    )

    expect(
      setFeeReceiver,
    ).toHaveBeenCalledWith(
      NEW_RECEIVER,
    )

    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('blocks invalid and unchanged addresses', async () => {
    const user = userEvent.setup()

    render(
      <LanguageProvider>
        <AdminFeeReceiverAction
          wallet={createWallet()}
          isVaultManagerOwner
          currentFeeReceiver={OWNER}
          refresh={vi.fn()}
        />
      </LanguageProvider>,
    )

    const button =
      screen.getByRole('button', {
        name: 'Update fee receiver',
      })

    expect(button).toBeDisabled()

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()

    const input =
      screen.getByLabelText(
        'New fee receiver',
      )

    await user.clear(input)
    await user.type(input, 'invalid')

    expect(button).toBeDisabled()

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'Enter a valid Ethereum address.',
    )
  })
})