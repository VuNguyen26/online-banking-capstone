import {
  useLanguage,
} from '../i18n/useLanguage'

export function LanguageSwitcher() {
  const {
    language,
    setLanguage,
    t,
  } = useLanguage()

  return (
    <div
      className="language-switcher"
      aria-label={t('language')}
    >
      <button
        type="button"
        aria-label={t('vietnamese')}
        aria-pressed={
          language === 'vi'
        }
        onClick={() =>
          setLanguage('vi')
        }
      >
        <span
                className="language-flag"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 30 20"
                  focusable="false"
                >
                  <path
                    fill="#da251d"
                    d="M0 0h30v20H0z"
                  />

                  <path
                    fill="#ff0"
                    d="m15 4.1 1.38 4.24h4.46l-3.61 2.62 1.38 4.24L15 12.58l-3.61 2.62 1.38-4.24-3.61-2.62h4.46z"
                  />
                </svg>
              </span>
        VI
      </button>

      <button
        type="button"
        aria-label={t('english')}
        aria-pressed={
          language === 'en'
        }
        onClick={() =>
          setLanguage('en')
        }
      >
        <span
                className="language-flag"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 60 36"
                  focusable="false"
                >
                  <path
                    fill="#012169"
                    d="M0 0h60v36H0z"
                  />

                  <path
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="7"
                    d="m0 0 60 36M60 0 0 36"
                  />

                  <path
                    fill="none"
                    stroke="#c8102e"
                    strokeWidth="3.5"
                    d="m0 0 60 36M60 0 0 36"
                  />

                  <path
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="12"
                    d="M30 0v36M0 18h60"
                  />

                  <path
                    fill="none"
                    stroke="#c8102e"
                    strokeWidth="7"
                    d="M30 0v36M0 18h60"
                  />
                </svg>
              </span>
        EN
      </button>
    </div>
  )
}
