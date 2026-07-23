import {
  cleanup,
  render,
  screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  ASSISTANT_COLLAPSED_STORAGE_KEY,
  AssistantLauncher,
  SPLINE_ASSISTANT_URL,
} from './AssistantLauncher'

const openLabel =
  'Mở trợ lý SafeBank'

const closeLabel =
  'Đóng trợ lý SafeBank'

const dialogLabel =
  'AI Banking Assistant'

const robotTitle =
  'Robot trợ lý SafeBank 3D'

function queryRobotIframe() {
  return document.querySelector<HTMLIFrameElement>(
    'iframe[title="' + robotTitle + '"]',
  )
}

function renderLauncher() {
  return render(
    <AssistantLauncher
      openLabel={openLabel}
      closeLabel={closeLabel}
      dialogLabel={dialogLabel}
      robotTitle={robotTitle}
      neonLabel="Trợ lý SafeBank"
    >
      <p>Nội dung trợ lý</p>
    </AssistantLauncher>,
  )
}

function mockViewport(
  matches: boolean,
) {
  Object.defineProperty(
    window,
    'matchMedia',
    {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation(
        (query: string) => ({
          matches,
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }),
      ),
    },
  )
}

describe('AssistantLauncher', () => {
  beforeEach(() => {
    window.localStorage.clear()
    mockViewport(false)
  })

  afterEach(() => {
    cleanup()
    window.localStorage.clear()
    document.body.style.overflow = ''
  })

  it('starts with the compact launcher on desktop', () => {
    renderLauncher()

    expect(
      screen.getByRole('button', {
        name: openLabel,
      }),
    ).toHaveAttribute(
      'aria-expanded',
      'false',
    )

    expect(
      screen.getByRole('button', {
        name: robotTitle,
      }),
    ).toBeInTheDocument()

    expect(
      queryRobotIframe(),
    ).not.toBeInTheDocument()

    expect(
      window.localStorage.getItem(
        ASSISTANT_COLLAPSED_STORAGE_KEY,
      ),
    ).toBeNull()
  })

  it('shows the Spline preview only after an explicit action', async () => {
    const user = userEvent.setup()

    renderLauncher()

    await user.click(
      screen.getByRole('button', {
        name: robotTitle,
      }),
    )

    expect(
      queryRobotIframe(),
    ).toHaveAttribute(
      'src',
      SPLINE_ASSISTANT_URL,
    )

    expect(
      window.localStorage.getItem(
        ASSISTANT_COLLAPSED_STORAGE_KEY,
      ),
    ).toBe('false')
  })

  it('collapses the robot preview and remembers the preference', async () => {
    const user = userEvent.setup()

    window.localStorage.setItem(
      ASSISTANT_COLLAPSED_STORAGE_KEY,
      'false',
    )

    renderLauncher()

    expect(
      queryRobotIframe(),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', {
        name: closeLabel,
      }),
    )

    expect(
      queryRobotIframe(),
    ).not.toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: openLabel,
      }),
    ).toBeInTheDocument()

    expect(
      window.localStorage.getItem(
        ASSISTANT_COLLAPSED_STORAGE_KEY,
      ),
    ).toBe('true')
  })

  it('uses only the compact assistant control on small screens', () => {
    mockViewport(true)

    renderLauncher()

    expect(
      screen.getByRole('button', {
        name: openLabel,
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('button', {
        name: robotTitle,
      }),
    ).not.toBeInTheDocument()

    expect(
      queryRobotIframe(),
    ).not.toBeInTheDocument()
  })

  it('opens and closes the accessible dialog', async () => {
    const user = userEvent.setup()

    renderLauncher()

    const trigger = screen.getByRole(
      'button',
      {
        name: openLabel,
      },
    )

    await user.click(trigger)

    expect(trigger).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    expect(
      screen.getByRole('dialog', {
        name: dialogLabel,
      }),
    ).toBeInTheDocument()

    expect(
      document.body.style.overflow,
    ).toBe('hidden')

    await user.click(
      screen.getByRole('button', {
        name: closeLabel,
      }),
    )

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()

    expect(trigger).toHaveAttribute(
      'aria-expanded',
      'false',
    )

    expect(
      document.body.style.overflow,
    ).toBe('')
  })

  it('closes the dialog with Escape', async () => {
    const user = userEvent.setup()

    renderLauncher()

    await user.click(
      screen.getByRole('button', {
        name: openLabel,
      }),
    )

    expect(
      screen.getByRole('dialog'),
    ).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()
  })
})