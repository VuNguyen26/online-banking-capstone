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
        <span aria-hidden="true">
          🇻🇳
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
        <span aria-hidden="true">
          🇬🇧
        </span>
        EN
      </button>
    </div>
  )
}
