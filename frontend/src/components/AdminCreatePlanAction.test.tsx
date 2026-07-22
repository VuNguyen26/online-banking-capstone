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
  AdminCreatePlanAction,
} from './AdminCreatePlanAction'

const ACCOUNT =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const HASH =
  `0x${'a'.repeat(64)}`

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

describe('AdminCreatePlanAction', () => {
  beforeEach(() => {
    localStorage.setItem(
      'safebank.language',
      'en',
    )
  })

  it('creates the default plan with exact bigint values', async () => {
    const user = userEvent.setup()

    const createPlan = vi.fn(
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
        <AdminCreatePlanAction
          wallet={createWallet()}
          isSavingCoreOwner
          refresh={refresh}
          createWriteContracts={() => ({
            savingCore: {
              createPlan,
            },
          })}
        />
      </LanguageProvider>,
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Create plan',
      }),
    )

    expect(
      createPlan,
    ).toHaveBeenCalledWith(
      180n,
      200n,
      100_000_000n,
      10_000_000_000n,
      750n,
      true,
    )

    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('blocks a maximum deposit below the minimum', async () => {
    const user = userEvent.setup()

    render(
      <LanguageProvider>
        <AdminCreatePlanAction
          wallet={createWallet()}
          isSavingCoreOwner
          refresh={vi.fn()}
        />
      </LanguageProvider>,
    )

    const maximum =
      screen.getByLabelText(
        'Maximum deposit (mUSDC)',
      )

    await user.clear(maximum)
    await user.type(maximum, '50')

    expect(
      screen.getByRole('button', {
        name: 'Create plan',
      }),
    ).toBeDisabled()

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'Maximum deposit must be greater than or equal to the positive minimum deposit.',
    )
  })
})