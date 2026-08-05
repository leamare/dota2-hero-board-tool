import { APP_VERSION } from '../lib/config';
import { HOTKEYS } from '../lib/useHotkeys';
import { useT } from '../lib/i18n';
import Rich from '../components/ui/Rich';

/**
 * The docs page. Every line of prose lives in the locale files under `about.*`
 * and carries its own emphasis, code spans and links as a small markdown subset
 * (see Rich) — the outline is here, the words are data.
 */

/** The one sample that isn't prose, so it isn't translated. */
const JSON_SAMPLE = `[
  {
    "id": "…",
    "name": "My grid",
    "board": {
      "name": "My grid",
      "author": "optional",
      "description": "optional",
      "columns": 3,
      "portraitType": 0,
      "itemStyle": 0,
      "size": 0,
      "colorfulLabels": true,
      "centered": false,
      "darkenedBg": true,
      "categories": [
        {
          "id": "…",
          "text": "My cores",
          "color": "red",
          "wideness": 0,
          "elements": [
            { "kind": "hero", "refId": 1 },
            { "kind": "hero", "refId": 5, "alticon": "persona1" },
            { "kind": "item", "refId": 116 },
            { "kind": "break" },
            { "kind": "empty" }
          ]
        }
      ]
    }
  }
]`;

export default function AboutPage() {
  const t = useT();
  const a = (key: string) => t(`about.${key}`);

  /** A `<ul>` of rich-text lines. */
  const list = (keys: string[], className?: string) => (
    <ul className={className}>
      {keys.map((k) => (
        <li key={k}>
          <Rich text={a(k)} />
        </li>
      ))}
    </ul>
  );

  const p = (key: string, className?: string) => (
    <p className={className}>
      <Rich text={a(key)} />
    </p>
  );

  return (
    <div className="docs-page">
      <h1>{a('title')}</h1>

      <div className="docs-body">
        <section className="docs-section">
          <h2>{a('whatIs.h')}</h2>
          {p('whatIs.p1')}
          {p('whatIs.p2')}
          {p('whatIs.p3')}
        </section>

        <section className="docs-section">
          <h2>{a('building.h')}</h2>
          {list([
            'building.categories',
            'building.chains',
            'building.breaks',
            'building.labels',
            'building.columns',
          ])}
        </section>

        <section className="docs-section">
          <h2>{a('autogrid.h')}</h2>
          {p('autogrid.intro')}
          {list([
            'autogrid.tiers',
            'autogrid.roleGrids',
            'autogrid.total',
            'autogrid.overall',
            'autogrid.metaLevels',
          ])}

          <h3>{a('autogrid.personalH')}</h3>
          {p('autogrid.personalIntro')}
          {list(['autogrid.best', 'autogrid.practice', 'autogrid.bans', 'autogrid.roles'])}
          {p('autogrid.notYet', 'muted')}
        </section>

        <section className="docs-section">
          <h2>{a('keys.h')}</h2>
          {p('keys.intro')}
          <ul className="docs-format">
            {HOTKEYS.map((h) => (
              <li key={h.keys}>
                <code>{h.keys}</code> — {h.action}
              </li>
            ))}
          </ul>
        </section>

        <section className="docs-section">
          <h2>{a('formats.h')}</h2>
          {p('formats.intro')}

          <h3>{a('formats.codeH')}</h3>
          {p('formats.codeP')}
          {list(
            ['formats.f1', 'formats.f2', 'formats.f3', 'formats.f4', 'formats.f5', 'formats.f6'],
            'docs-format',
          )}
          {p('formats.codeNote', 'muted')}

          <h3>{a('formats.allH')}</h3>
          {p('formats.allP')}

          <h3>{a('formats.jsonH')}</h3>
          {p('formats.jsonP')}
          <pre className="docs-code">{JSON_SAMPLE}</pre>
          {p('formats.jsonNote')}

          <h3>{a('formats.gameH')}</h3>
          {p('formats.gameP')}

          <h3>{a('formats.oldH')}</h3>
          {p('formats.oldP')}
        </section>

        <section className="docs-section">
          <h2>{a('sharing.h')}</h2>
          {list(['sharing.link', 'sharing.image', 'sharing.print', 'sharing.files'])}
        </section>

        <section className="docs-section">
          <h2>{a('credits.h')}</h2>
          <p>
            <Rich text={a('credits.idea')} />
            <br />
            <Rich text={a('credits.dev')} />
            <br />
            <Rich text={a('credits.version')} /> {APP_VERSION}
          </p>
          {p('credits.inspired')}
        </section>
      </div>
    </div>
  );
}
