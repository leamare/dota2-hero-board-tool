import { Link } from 'react-router-dom';
import { APP_VERSION } from '../lib/config';

export default function AboutPage() {
  return (
    <div className="docs-page">
      <h1>Hero Grid Tool</h1>

      <div className="docs-body">
        <section className="docs-section">
          <h2>What it is</h2>
          <p>
            <b>Hero Grid Tool</b> is an "alt-tab" tool for building and customizing Dota 2 hero
            layouts — a personal notebook where you arrange heroes and items into whatever
            categories make sense to you.
          </p>
          <p>
            Use the <Link to="/edit">Edit</Link> tab to build a grid: add categories, fill them with
            heroes and items from the adding dialog or by dragging portraits around, then rename,
            recolour and resize them. The <Link to="/view">View</Link> tab is the clean read-only
            version you keep next to the game, and <Link to="/layouts">Grids</Link> holds every grid
            you have saved.
          </p>
          <p>
            Everything lives in your browser's local storage — nothing is uploaded. Grids travel as
            self-contained codes, files, links or images.
          </p>
        </section>

        <section className="docs-section">
          <h2>Building a grid</h2>
          <ul>
            <li>
              <b>Categories</b> hold heroes, items, empty slots and row breaks. Each one can
              override the grid's portrait style, size and item icons.
            </li>
            <li>
              <b>Chains</b> keep categories together: link them horizontally (adjacent columns) or
              vertically (stacked rows) with the ↔ and ↕ buttons. A category can be in both.
            </li>
            <li>
              <b>Row breaks</b> split a category's portraits onto a new line.
            </li>
            <li>
              <b>Labels</b> can be free text, one of the presets (lanes, positions, roles, tiers) or
              a hero/item/facet icon — optionally with a colour tag.
            </li>
            <li>
              The column count adapts to the window: a narrow screen caps the number of columns so
              categories stay readable.
            </li>
          </ul>
        </section>

        <section className="docs-section">
          <h2>Grid formats</h2>
          <p>
            The tool reads every format below — paste it into{' '}
            <Link to="/layouts">Grids → Import</Link>, drop in a file, or scan a QR code. Imports are
            detected automatically, so you never have to say which kind it is.
          </p>

          <h3>Grid code (main format)</h3>
          <p>
            A single grid is packed into a binary record and written as URL-safe base64 — typically
            around a hundred characters. This is what share links carry (
            <code>/import?b=&lt;code&gt;</code>), what <b>Copy code</b> puts on your clipboard, and
            what the <code>.txt</code> export contains. The record is, in order:
          </p>
          <ul className="docs-format">
            <li>
              <code>version</code> — one byte; the current format is <code>7</code>, and older codes
              still import.
            </li>
            <li>
              <code>flags</code> — one byte of board toggles: colourful labels, centered, darkened
              background.
            </li>
            <li>
              <code>columns</code>, <code>portrait type</code>, <code>item style</code>,{' '}
              <code>size</code> — one byte each.
            </li>
            <li>
              <code>name</code>, <code>icon</code>, <code>author</code> — length-prefixed UTF-8
              strings (author may be empty).
            </li>
            <li>
              <code>categories</code> — a count, then one record per category: flags, label (preset
              id or text), optional icon, colour, width, header size, chain ids, per-category style
              overrides, and finally its elements.
            </li>
            <li>
              <code>elements</code> — one byte of kind and flags each, plus a hero/item id, a custom
              tag, or nothing for empty slots and row breaks.
            </li>
          </ul>
          <p className="muted">
            Because the format is positional and versioned, a code always decodes to exactly the
            grid it came from, and new fields can be added without breaking old links.
          </p>

          <h3>All grids code</h3>
          <p>
            Your whole collection can be exported at once. That is the JSON list below, base64
            encoded, as used by <b>Share all</b> and <code>/layouts?l=&lt;code&gt;</code>.
          </p>

          <h3>JSON</h3>
          <p>
            The <code>.json</code> export is human-readable and diff-friendly — a saved grid, or a
            list of them:
          </p>
          <pre className="docs-code">{`[
  {
    "id": "…",
    "name": "My grid",
    "board": {
      "name": "My grid",
      "author": "optional",
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
]`}</pre>
          <p>
            A bare <code>board</code> object works too. Hero and item <code>refId</code>s are the
            standard Dota ids, <code>preset</code> replaces <code>text</code> for preset labels, and{' '}
            <code>hGroup</code> / <code>vGroup</code> mark chained categories.
          </p>

          <h3>Old version files</h3>
          <p>
            JSON exported from the previous (AngularJS) version of the tool is accepted as-is and
            converted on import: preset labels, colour tags, widths, the "bigger portraits" flag and
            hero lists all carry over. Grids left in that version's local storage are converted
            automatically the first time you open this one. Since old grids had no item or
            portrait-style settings, converted grids start from the current defaults.
          </p>
        </section>

        <section className="docs-section">
          <h2>Sharing</h2>
          <ul>
            <li>
              <b>Link</b> — the grid code in a URL, plus a QR code for getting it onto a phone.
            </li>
            <li>
              <b>Image</b> — a PNG of the whole grid, 1400px wide, with a QR code linking back to
              the editable version and the author credit if the grid has one.
            </li>
            <li>
              <b>Files</b> — <code>.txt</code> for a code, <code>.json</code> for one grid or all of
              them.
            </li>
          </ul>
        </section>

        <section className="docs-section">
          <h2>Credits</h2>
          <p>
            <b>Idea:</b>{' '}
            <a href="https://twitch.tv/xakoh" target="_blank" rel="noreferrer">
              TPB.XaKoH
            </a>
            <br />
            <b>Developer:</b>{' '}
            <a href="https://spectral.gg" target="_blank" rel="noreferrer">
              Leamare
            </a>
            <br />
            <b>Version:</b> {APP_VERSION}
          </p>
          <p>
            Inspired by{' '}
            <a
              href="https://www.reddit.com/r/DotA2/comments/7iurzb/i_started_creating_a_drafting_chart_around_my/"
              target="_blank"
              rel="noreferrer"
            >
              this reddit post
            </a>
            . Hero and item data comes from the spectral.gg LRG2 API; images from the spectral
            courier CDN.
          </p>
        </section>
      </div>
    </div>
  );
}
