import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  translations,
  type Language,
} from './translations'
import {
  LanguageContext,
  type LanguageContextValue,
} from './language-context'

const STORAGE_KEY =
  'safebank.language'

function readInitialLanguage():
  Language {
  try {
    return localStorage.getItem(
      STORAGE_KEY,
    ) === 'en'
      ? 'en'
      : 'vi'
  } catch {
    return 'vi'
  }
}

export function LanguageProvider({
  children,
}: {
  children: ReactNode
}) {
  const [language, setLanguage] =
    useState<Language>(
      readInitialLanguage,
    )

  useEffect(() => {
    document.documentElement.lang =
      language

    try {
      localStorage.setItem(
        STORAGE_KEY,
        language,
      )
    } catch {
      // Language persistence is optional.
    }
  }, [language])

  const value =
    useMemo<LanguageContextValue>(
      () => ({
        language,
        setLanguage,
        t: (key) =>
          translations[language][key],
      }),
      [language],
    )

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  )
}
