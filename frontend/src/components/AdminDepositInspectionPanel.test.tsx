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
import {
  AdminDepositInspectionPanel,
} from './AdminDepositInspectionPanel'

describe('AdminDepositInspectionPanel', () => {
  beforeEach(() => {
    localStorage.setItem(
      'safebank.language',
      'en',
    )
  })

  it('reads and displays a deposit without requiring a wallet', async () => {
    const user = userEvent.setup()

    const readDeposit = vi.fn(
      async (depositId: bigint) => ({
        depositId,
        planId: 1n,
        principal: 100_000_000n,
        startedAt: 1_700_000_000n,
        maturityAt: 1_715_552_000n,
        tenorDays: 180n,
        aprBpsAtOpen: 200n,
        penaltyBpsAtOpen: 750n,
        status: 0n,
      }),
    )

    render(
      <LanguageProvider>
        <AdminDepositInspectionPanel
          readDeposit={readDeposit}
        />
      </LanguageProvider>,
    )

    await user.type(
      screen.getByLabelText(
        'Deposit ID',
      ),
      '3',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Search deposit',
      }),
    )

    expect(
      readDeposit,
    ).toHaveBeenCalledWith(3n)

    expect(
      await screen.findByRole(
        'heading',
        {
          name: 'Deposit #3',
        },
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Active'),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        /100.*mUSDC/,
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText('2%'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('7.5%'),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        '2023-11-14 22:13:20 UTC',
      ),
    ).toBeInTheDocument()
  })

  it('blocks zero and malformed deposit IDs', async () => {
    const user = userEvent.setup()
    const readDeposit = vi.fn()

    render(
      <LanguageProvider>
        <AdminDepositInspectionPanel
          readDeposit={readDeposit}
        />
      </LanguageProvider>,
    )

    const input =
      screen.getByLabelText(
        'Deposit ID',
      )

    await user.type(input, '0')

    expect(
      screen.getByRole('button', {
        name: 'Search deposit',
      }),
    ).toBeDisabled()

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'Deposit ID must be a positive whole number.',
    )

    expect(readDeposit).not.toHaveBeenCalled()
  })

  it('shows a safe error when the contract read fails', async () => {
    const user = userEvent.setup()

    render(
      <LanguageProvider>
        <AdminDepositInspectionPanel
          readDeposit={vi.fn(
            async () => {
              throw new Error(
                'Contract read failed.',
              )
            },
          )}
        />
      </LanguageProvider>,
    )

    await user.type(
      screen.getByLabelText(
        'Deposit ID',
      ),
      '999',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Search deposit',
      }),
    )

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent(
      'Deposit could not be read. Check the ID and try again.',
    )
  })
})