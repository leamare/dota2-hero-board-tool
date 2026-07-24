import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { DICTS, I18nContext, LOCALE_KEY, detectLocale, type LocaleCode } from '../lib/i18n';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(detectLocale);

  const setLocale = useCallback((l: LocaleCode) => {
    localStorage.setItem(LOCALE_KEY, l);
    setLocaleState(l);
  }, []);

  const t = useCallback(
    (key: string) => DICTS[locale][key] ?? DICTS.en[key] ?? key,
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
