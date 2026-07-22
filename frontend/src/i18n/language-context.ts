import {
  createContext,
} from 'react'

import {
  translations,
  type Language,
  type TranslationKey,
} from './translations'

export type LanguageContextValue = {
  language: Language
  setLanguage: (
    language: Language,
  ) => void
  t: (
    key: TranslationKey,
  ) => string
}

export const LanguageContext =
  createContext<LanguageContextValue>({
    language: 'vi',
    setLanguage: () => undefined,
    t: (key) =>
      translations.vi[key],
  })
