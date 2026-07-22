import {
  render,
  screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

vi.mock('./hooks/useWallet', () => ({
  useWallet: () => ({
    name: 'wallet',
  }),
}))

vi.mock('./hooks/useSafeBankData', () => ({
  useSafeBankData: () => ({
    name: 'safe-bank',
  }),
}))

vi.mock(
  './components/UserDashboard',
  () => ({
    UserDashboard: ({
      onViewChange,
    }: {
      onViewChange: (
        view: 'user' | 'admin',
      ) => void
    }) => (
      <button
        type="button"
        onClick={() =>
          onViewChange('admin')
        }
      >
        Open admin
      </button>
    ),
  }),
)

vi.mock(
  './components/AdminDashboard',
  () => ({
    AdminDashboard: ({
      onViewChange,
    }: {
      onViewChange: (
        view: 'user' | 'admin',
      ) => void
    }) => (
      <button
        type="button"
        onClick={() =>
          onViewChange('user')
        }
      >
        Open user
      </button>
    ),
  }),
)

vi.mock(
  './providers/AdminDataProvider',
  () => ({
    AdminDataProvider: ({
      children,
    }: {
      children: React.ReactNode
    }) => (
      <div data-testid="admin-provider">
        {children}
      </div>
    ),
  }),
)

import App from './App'

describe('App view switching', () => {
  it('mounts admin data only for the admin view', async () => {
    const user = userEvent.setup()

    render(<App />)

    expect(
      screen.queryByTestId(
        'admin-provider',
      ),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', {
        name: 'Open admin',
      }),
    )

    expect(
      screen.getByTestId(
        'admin-provider',
      ),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', {
        name: 'Open user',
      }),
    )

    expect(
      screen.queryByTestId(
        'admin-provider',
      ),
    ).not.toBeInTheDocument()
  })
})