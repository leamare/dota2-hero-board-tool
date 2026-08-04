import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_LOCALE, DICTS, LOCALES, detectLocale, translate } from './i18n';

describe('locale files', () => {
  it('loads every file in data/locales, English first', () => {
    expect(LOCALES.length).toBeGreaterThanOrEqual(5);
    expect(LOCALES[0].code).toBe('en');
    expect(LOCALES.map((l) => l.code)).toEqual(expect.arrayContaining(['ru', 'zh', 'uk', 'pt']));
  });

  it('takes each language name from its own file', () => {
    expect(LOCALES.find((l) => l.code === 'ru')?.label).toBe('Русский');
    expect(LOCALES.every((l) => l.label && l.label !== l.code)).toBe(true);
  });

  it('keeps the label out of the messages', () => {
    for (const code of Object.keys(DICTS)) expect(DICTS[code]).not.toHaveProperty('_label');
  });

  it('translates every English key in every language', () => {
    const keys = Object.keys(DICTS[DEFAULT_LOCALE]);
    expect(keys.length).toBeGreaterThan(90);
    for (const code of Object.keys(DICTS)) {
      const missing = keys.filter((k) => !DICTS[code][k]);
      expect({ code, missing }).toEqual({ code, missing: [] });
    }
  });

  it('falls back to English, then to the key itself', () => {
    expect(translate('ru', 'nav.view')).toBe(DICTS.ru['nav.view']);
    expect(translate('nope', 'nav.view')).toBe(DICTS.en['nav.view']);
    expect(translate('en', 'no.such.key')).toBe('no.such.key');
  });

  describe('detectLocale', () => {
    const withEnv = (language: string, saved?: string) => {
      vi.stubGlobal('navigator', { language });
      vi.stubGlobal('localStorage', { getItem: () => saved ?? null });
    };
    afterEach(() => vi.unstubAllGlobals());

    it('prefers what was saved', () => {
      withEnv('ru-RU', 'zh');
      expect(detectLocale()).toBe('zh');
    });

    it('matches a regional browser tag to its language file', () => {
      withEnv('pt-BR');
      expect(detectLocale()).toBe('pt');
      withEnv('ru-RU');
      expect(detectLocale()).toBe('ru');
    });

    it('falls back to English for a language with no file', () => {
      withEnv('de-DE');
      expect(detectLocale()).toBe(DEFAULT_LOCALE);
      // ...and ignores a saved locale that no longer has a file
      withEnv('de-DE', 'kl');
      expect(detectLocale()).toBe(DEFAULT_LOCALE);
    });
  });
});
