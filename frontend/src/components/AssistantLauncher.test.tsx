import {
  render,
  screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  AssistantLauncher,
  SPLINE_ASSISTANT_URL,
} from './AssistantLauncher'

function renderLauncher() {
  return render(
    <AssistantLauncher
      openLabel="Open SafeBank assistant"
      closeLabel="Close SafeBank assistant"
      dialogLabel="SafeBank assistant"
      robotTitle="SafeBank 3D assistant"
      neonLabel="SafeBank Assistant"
    >
      <p>Assistant content</p>
    </AssistantLauncher>,
  )
}

describe('AssistantLauncher', () => {
  it('renders the Spline robot and starts closed', () => {
    renderLauncher()

    expect(
      screen.getByTitle(
        'SafeBank 3D assistant',
      ),
    ).toHaveAttribute(
      'src',
      SPLINE_ASSISTANT_URL,
    )

    expect(
      screen.getByRole('button', {
        name: 'Open SafeBank assistant',
      }),
    ).toHaveAttribute(
      'aria-expanded',
      'false',
    )

    expect(
      screen.getByText(
        'SafeBank Assistant',
      ),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()
  })

  it('opens and closes through the visible controls', async () => {
    const user = userEvent.setup()

    renderLauncher()

    const trigger =
      screen.getByRole('button', {
        name: 'Open SafeBank assistant',
      })

    await user.click(trigger)

    expect(
      screen.getByRole('dialog', {
        name: 'SafeBank assistant',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Assistant content',
      ),
    ).toBeInTheDocument()

    expect(trigger).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    const closeButton =
      screen.getByRole('button', {
        name: 'Close SafeBank assistant',
      })

    expect(closeButton).toHaveFocus()

    await user.click(closeButton)

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()

    expect(trigger).toHaveFocus()
  })

  it('closes with Escape and unmounts its content', async () => {
    const user = userEvent.setup()

    renderLauncher()

    await user.click(
      screen.getByRole('button', {
        name: 'Open SafeBank assistant',
      }),
    )

    expect(
      screen.getByText(
        'Assistant content',
      ),
    ).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(
      screen.queryByText(
        'Assistant content',
      ),
    ).not.toBeInTheDocument()
  })
})