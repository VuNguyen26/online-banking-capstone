import {
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { JsonRpcSigner } from 'ethers'
import { vi } from 'vitest'

import { TestTokenFaucet } from './TestTokenFaucet'

const account =
  '0x1111111111111111111111111111111111111111'

function props() {
  return {
    wallet: {
      isConnected: true,
      isSepolia: true,
      account,
      getSigner: vi.fn(
      async () => ({} as JsonRpcSigner),
    ),
    },
    safeBank: {
      refresh: vi.fn(async () => undefined),
    },
  }
}

describe('TestTokenFaucet', () => {
  it('mints 1000 mUSDC and refreshes', async () => {
    const user = userEvent.setup()
    const values = props()
    const mint = vi.fn(async () => ({
      hash: `0x${'a'.repeat(64)}`,
      wait: async () => ({ status: 1 }),
    }))

    render(
      <TestTokenFaucet
        wallet={values.wallet}
        safeBank={values.safeBank}
        createContracts={() => ({
          mockUsdc: { mint },
        })}
      />,
    )

    await user.click(
      screen.getByRole('button'),
    )

    await waitFor(() =>
      expect(mint).toHaveBeenCalledWith(
        account,
        1_000_000_000n,
      ),
    )

    await waitFor(() =>
      expect(
        values.safeBank.refresh,
      ).toHaveBeenCalledTimes(1),
    )
  })

  it('disables mint on the wrong network', () => {
    const values = props()

    render(
      <TestTokenFaucet
        wallet={{
          ...values.wallet,
          isSepolia: false,
        }}
        safeBank={values.safeBank}
      />,
    )

    expect(
      screen.getByRole('button'),
    ).toBeDisabled()
  })

  it('does not refresh after rejection', async () => {
    const user = userEvent.setup()
    const values = props()

    render(
      <TestTokenFaucet
        wallet={values.wallet}
        safeBank={values.safeBank}
        createContracts={() => ({
          mockUsdc: {
            mint: async () => {
              throw {
                code: 4001,
                message: 'Rejected',
              }
            },
          },
        })}
      />,
    )

    await user.click(
      screen.getByRole('button'),
    )

    await waitFor(() =>
      expect(
        screen.getByRole('alert'),
      ).toHaveTextContent(
        'Bạn đã từ chối giao dịch trong ví.',
      ),
    )

    expect(
      values.safeBank.refresh,
    ).not.toHaveBeenCalled()
  })
})
