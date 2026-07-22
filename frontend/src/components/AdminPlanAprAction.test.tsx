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
  AdminPlanAprAction,
} from './AdminPlanAprAction'

const ACCOUNT =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const HASH =
  `0x${'f'.repeat(64)}`

const PLAN = {
  planId: 1n,
  tenorDays: 180n,
  aprBps: 200n,
  minDeposit: 100_000_000n,
  maxDeposit: 10_000_000_000n,
  earlyWithdrawPenaltyBps: 750n,
  enabled: true,
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

describe('AdminPlanAprAction', () => {
  beforeEach(() => {
    localStorage.setItem(
      'safebank.language',
      'en',
    )
  })

  it('updates APR using exact basis points and refreshes data', async () => {
    const user = userEvent.setup()

    const updatePlan = vi.fn(
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
        <AdminPlanAprAction
          plan={PLAN}
          wallet={createWallet()}
          isSavingCoreOwner
          refresh={refresh}
          createWriteContracts={() => ({
            savingCore: {
              updatePlan,
            },
          })}
        />
      </LanguageProvider>,
    )

    const input =
      screen.getByLabelText(
        'New APR',
      )

    await user.clear(input)
    await user.type(input, '7.25')

    await user.click(
      screen.getByRole('button', {
        name: 'Update APR',
      }),
    )

    expect(
      updatePlan,
    ).toHaveBeenCalledWith(
      1n,
      725n,
    )

    expect(refresh).toHaveBeenCalledTimes(1)

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Transaction confirmed.',
    )
  })

  it('blocks unchanged and out-of-range APR values', async () => {
    const user = userEvent.setup()

    render(
      <LanguageProvider>
        <AdminPlanAprAction
          plan={PLAN}
          wallet={createWallet()}
          isSavingCoreOwner
          refresh={vi.fn()}
        />
      </LanguageProvider>,
    )

    const button =
      screen.getByRole('button', {
        name: 'Update APR',
      })

    expect(button).toBeDisabled()

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'Enter an APR different from the current value.',
    )

    const input =
      screen.getByLabelText(
        'New APR',
      )

    await user.clear(input)
    await user.type(input, '100.01')

    expect(button).toBeDisabled()

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'APR must be between 0.01% and 100%.',
    )
  })
})