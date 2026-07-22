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
  AdminPlanToggleAction,
} from './AdminPlanToggleAction'

const ACCOUNT =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const HASH =
  `0x${'e'.repeat(64)}`

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

const PLAN = {
  planId: 1n,
  tenorDays: 180n,
  aprBps: 200n,
  minDeposit: 100_000_000n,
  maxDeposit: 10_000_000_000n,
  earlyWithdrawPenaltyBps: 750n,
  enabled: true,
}

describe('AdminPlanToggleAction', () => {
  beforeEach(() => {
    localStorage.setItem(
      'safebank.language',
      'en',
    )
  })

  it('disables an enabled plan and refreshes admin data', async () => {
    const user = userEvent.setup()
    const disablePlan = vi.fn(
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
        <AdminPlanToggleAction
          plan={PLAN}
          wallet={createWallet()}
          isSavingCoreOwner
          refresh={refresh}
          createWriteContracts={() => ({
            savingCore: {
              disablePlan,
            },
          })}
        />
      </LanguageProvider>,
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Disable plan',
      }),
    )

    const dialog = screen.getByRole(
      'dialog',
      {
        name: 'Confirm plan disable',
      },
    )

    expect(dialog).toHaveTextContent(
      'The plan will stop accepting new deposits.',
    )
    expect(dialog).toHaveTextContent(
      'Plan ID',
    )
    expect(dialog).toHaveTextContent('#1')
    expect(dialog).toHaveTextContent(
      'Enabled',
    )
    expect(dialog).toHaveTextContent(
      'Disabled',
    )

    expect(
      disablePlan,
    ).not.toHaveBeenCalled()

    expect(refresh).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', {
        name: 'Continue to wallet',
      }),
    )

    expect(
      disablePlan,
    ).toHaveBeenCalledWith(1n)

    expect(refresh).toHaveBeenCalledTimes(1)

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Transaction confirmed.',
    )
  })

  it('blocks a connected non-owner wallet', () => {
    render(
      <LanguageProvider>
        <AdminPlanToggleAction
          plan={PLAN}
          wallet={createWallet()}
          isSavingCoreOwner={false}
          refresh={vi.fn()}
        />
      </LanguageProvider>,
    )

    expect(
      screen.getByRole('button', {
        name: 'Disable plan',
      }),
    ).toBeDisabled()

    expect(
      screen.getByText(
        'Only the SavingCore owner can perform this action.',
      ),
    ).toBeInTheDocument()
  })
})