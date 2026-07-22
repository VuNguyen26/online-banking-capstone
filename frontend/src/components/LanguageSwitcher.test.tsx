import {
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  LanguageProvider,
} from '../i18n/LanguageProvider'
import {
  translations,
} from '../i18n/translations'
import {
  useLanguage,
} from '../i18n/useLanguage'
import {
  LanguageSwitcher,
} from './LanguageSwitcher'

const STORAGE_KEY =
  'safebank.language'

function LanguageProbe() {
  const {
    language,
    t,
  } = useLanguage()

  return (
    <>
      <output data-testid="language">
        {language}
      </output>
      <p data-testid="hero-title">
        {t('heroTitle')}
      </p>
    </>
  )
}

function renderLanguageUi() {
  return render(
    <LanguageProvider>
      <LanguageSwitcher />
      <LanguageProbe />
    </LanguageProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.lang = ''
})

describe('LanguageProvider and LanguageSwitcher', () => {
  it('uses Vietnamese by default', async () => {
    renderLanguageUi()

    expect(
      screen.getByTestId('language'),
    ).toHaveTextContent('vi')

    expect(
      screen.getByTestId('hero-title'),
    ).toHaveTextContent(
      translations.vi.heroTitle,
    )

    expect(
      screen.getByRole('button', {
        name: translations.vi.vietnamese,
      }),
    ).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await waitFor(() => {
      expect(
        document.documentElement.lang,
      ).toBe('vi')

      expect(
        localStorage.getItem(STORAGE_KEY),
      ).toBe('vi')
    })
  })

  it('switches to English and persists it', async () => {
    const user = userEvent.setup()

    renderLanguageUi()

    const englishButton =
      screen.getByRole('button', {
        name: translations.vi.english,
      })

    await user.click(englishButton)

    expect(
      screen.getByTestId('language'),
    ).toHaveTextContent('en')

    expect(
      screen.getByTestId('hero-title'),
    ).toHaveTextContent(
      translations.en.heroTitle,
    )

    expect(
      englishButton,
    ).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await waitFor(() => {
      expect(
        document.documentElement.lang,
      ).toBe('en')

      expect(
        localStorage.getItem(STORAGE_KEY),
      ).toBe('en')
    })
  })

  it('restores the saved English preference', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      'en',
    )

    renderLanguageUi()

    expect(
      screen.getByTestId('language'),
    ).toHaveTextContent('en')

    expect(
      screen.getByTestId('hero-title'),
    ).toHaveTextContent(
      translations.en.heroTitle,
    )

    expect(
      screen.getByRole('button', {
        name: translations.en.english,
      }),
    ).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await waitFor(() => {
      expect(
        document.documentElement.lang,
      ).toBe('en')
    })
  })
})
