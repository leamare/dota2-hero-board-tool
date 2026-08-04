import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { I18nContext, LOCALE_KEY, detectLocale, translate, type LocaleCode } from '../lib/i18n';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(detectLocale);

  const setLocale = useCallback((l: LocaleCode) => {
    localStorage.setItem(LOCALE_KEY, l);
    setLocaleState(l);
  }, []);

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
