import {
  render,
  screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  expect,
  it,
  vi,
} from 'vitest'

import {
  UiStatePanel,
} from './UiStatePanel'

it('renders an accessible loading state', () => {
  render(
    <UiStatePanel
      kind="loading"
      message="Loading protocol data"
    />,
  )

  expect(
    screen.getByRole('status'),
  ).toHaveTextContent(
    'Loading protocol data',
  )
})

it('renders an error action', async () => {
  const user = userEvent.setup()
  const retry = vi.fn()

  render(
    <UiStatePanel
      kind="error"
      message="RPC unavailable"
      actionLabel="Try again"
      onAction={retry}
    />,
  )

  expect(
    screen.getByRole('alert'),
  ).toHaveTextContent('RPC unavailable')

  await user.click(
    screen.getByRole('button', {
      name: 'Try again',
    }),
  )

  expect(retry).toHaveBeenCalledTimes(1)
})

it('renders an empty state without an alert role', () => {
  render(
    <UiStatePanel
      kind="empty"
      message="No items available"
    />,
  )

  expect(
    screen.getByText('No items available'),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('alert'),
  ).not.toBeInTheDocument()
})
