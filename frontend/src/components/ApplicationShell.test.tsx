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
  ApplicationShell,
} from './ApplicationShell'

describe('ApplicationShell', () => {
  beforeEach(() => {
    localStorage.setItem(
      'safebank.language',
      'vi',
    )
  })

  it('switches between user and admin views', async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()

    render(
      <LanguageProvider>
        <ApplicationShell
          activeView="user"
          onViewChange={onViewChange}
        >
          <div>Dashboard content</div>
        </ApplicationShell>
      </LanguageProvider>,
    )

    expect(
      screen.getByRole('button', {
        name: 'Người dùng',
      }),
    ).toHaveAttribute(
      'aria-current',
      'page',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Quản trị',
      }),
    )

    expect(onViewChange).toHaveBeenCalledWith(
      'admin',
    )
  })
})