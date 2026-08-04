import { createContext, useContext } from 'react';

/*
 * Translations live in `src/data/locales/<code>.json`, one file per language,
 * grouped by prefix (`sidebar: { title: … }`) so a file reads as sections
 * rather than a flat wall. Lookups still use the dotted key — the groups are
 * flattened on load — so `t('sidebar.title')` is unchanged.
 *
 * Files are picked up by glob rather than named here, so adding a language is a
 * matter of dropping one in: its `_label` is what the picker shows, and any key
 * it leaves out falls back to English.
 *
 * The files are bundled rather than fetched, which keeps `t()` synchronous —
 * they are a few kilobytes each, and a loading state for UI labels would show
 * up as a flash of untranslated text on every page.
 */

export type LocaleCode = string;

type Dict = Record<string, string>;

/** A locale file: nested groups of messages, or plain strings at the top. */
type LocaleFile = { [key: string]: string | LocaleFile };

/** The key each file carries its own language name under. */
const LABEL_KEY = '_label';

/** `{ sidebar: { title: 'x' } }` -> `{ 'sidebar.title': 'x' }`. */
function flatten(source: LocaleFile, prefix = ''): Dict {
  const out: Dict = {};
  for (const [key, value] of Object.entries(source)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out[path] = value;
    // a flat file still works: only objects are walked into
    else Object.assign(out, flatten(value, path));
  }
  return out;
}

const modules = import.meta.glob<LocaleFile>('../data/locales/*.json', {
  eager: true,
  import: 'default',
});

const loaded: { code: LocaleCode; label: string; dict: Dict }[] = Object.entries(modules)
  .map(([path, file]) => {
    const code = path.replace(/^.*\/(.+)\.json$/, '$1');
    const { [LABEL_KEY]: label, ...rest } = file;
    return {
      code,
      label: typeof label === 'string' && label ? label : code,
      dict: flatten(rest),
    };
  })
  // English first (it is the fallback), the rest alphabetically by code
  .sort((a, b) => (a.code === 'en' ? -1 : b.code === 'en' ? 1 : a.code.localeCompare(b.code)));

export const DICTS: Record<LocaleCode, Dict> = Object.fromEntries(
  loaded.map((l) => [l.code, l.dict]),
);

export const LOCALES: { code: LocaleCode; label: string }[] = loaded.map(({ code, label }) => ({
  code,
  label,
}));

export const DEFAULT_LOCALE: LocaleCode = DICTS.en ? 'en' : (LOCALES[0]?.code ?? 'en');

export const LOCALE_KEY = 'hgt.locale';

/** The saved choice, or the closest match to the browser's language. */
export function detectLocale(): LocaleCode {
  const saved = (typeof localStorage !== 'undefined' && localStorage.getItem(LOCALE_KEY)) || '';
  if (saved && DICTS[saved]) return saved;

  const nav = (typeof navigator !== 'undefined' ? navigator.language : '').toLowerCase();
  // "pt-br" matches the pt file; a bare tag matches its own file
  const match = LOCALES.find((l) => nav === l.code || nav.startsWith(`${l.code}-`));
  return match?.code ?? DEFAULT_LOCALE;
}

/** Look a key up in a locale, falling back to English and then to the key. */
export const translate = (locale: LocaleCode, key: string): string =>
  DICTS[locale]?.[key] ?? DICTS[DEFAULT_LOCALE]?.[key] ?? key;

interface I18nCtx {
  locale: LocaleCode;
  setLocale: (l: LocaleCode) => void;
  t: (key: string) => string;
}

export const I18nContext = createContext<I18nCtx>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (k) => translate(DEFAULT_LOCALE, k),
});

export const useI18n = () => useContext(I18nContext);
export const useT = () => useContext(I18nContext).t;
