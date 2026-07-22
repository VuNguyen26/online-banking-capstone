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

import {
  ConfirmationDialog,
} from './ConfirmationDialog'

describe('ConfirmationDialog', () => {
  it('renders nothing while closed', () => {
    render(
      <ConfirmationDialog
        open={false}
        title="Review action"
        confirmLabel="Continue"
        cancelLabel="Cancel"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()
  })

  it('renders an accessible review and confirms explicitly', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <ConfirmationDialog
        open
        title="Review action"
        description="Check the transaction details."
        confirmLabel="Continue to wallet"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      >
        <p>Plan #1</p>
      </ConfirmationDialog>,
    )

    const dialog = screen.getByRole(
      'dialog',
      {
        name: 'Review action',
      },
    )

    expect(dialog).toHaveAttribute(
      'aria-modal',
      'true',
    )
    expect(dialog).toHaveTextContent(
      'Check the transaction details.',
    )
    expect(dialog).toHaveTextContent(
      'Plan #1',
    )

    expect(
      screen.getByRole('button', {
        name: 'Cancel',
      }),
    ).toHaveFocus()

    await user.click(
      screen.getByRole('button', {
        name: 'Continue to wallet',
      }),
    )

    expect(onConfirm).toHaveBeenCalledTimes(
      1,
    )
  })

  it('can be cancelled by button, Escape or backdrop', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(
      <ConfirmationDialog
        open
        title="Review action"
        confirmLabel="Continue"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Cancel',
      }),
    )

    await user.keyboard('{Escape}')

    await user.click(
      screen.getByTestId(
        'confirmation-overlay',
      ),
    )

    expect(onCancel).toHaveBeenCalledTimes(
      3,
    )
  })
})