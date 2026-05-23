import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '@/i18n/translations'
import { translations } from '@/i18n/translations'

type Translations = (typeof translations)[Language]

interface LanguageState {
  language: Language
  t: Translations
  setLanguage: (lang: Language) => void
  toggle: () => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en' as Language,
      t: translations.en as Translations,
      setLanguage: (lang: Language) =>
        set({ language: lang, t: translations[lang] as Translations }),
      toggle: () =>
        set((state) => {
          const next: Language = state.language === 'en' ? 'te' : 'en'
          return { language: next, t: translations[next] as Translations }
        }),
    }),
    { name: 'mk-language' }
  )
)
