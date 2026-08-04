import { Link } from 'react-router-dom';
import { APP_VERSION } from '../lib/config';
import { HOTKEYS } from '../lib/useHotkeys';

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
          <h2>Autogrid</h2>
          <p>
            The <b>Autogrid</b> tab in the sidebar builds tier lists straight from the spectral.gg
            LRG2 stats reports — the same numbers behind{' '}
            <a href="https://stats.spectral.gg" target="_blank" rel="noreferrer">
              stats.spectral.gg
            </a>
            . Pick a report (or type your own report tag), tick the grids you want, and each one is
            saved under a dated name.
          </p>
          <ul>
            <li>
              <b>Tiers</b> — taken from the report's own tier lists where it has them, which are
              filtered and weighted by meta-level membership on the server. Reports without them
              fall back to ranking the positions table here: heroes picked less than 90% as often as
              the median for that position are dropped, and the rest are ordered by their{' '}
              <code>rank</code> score and split into six tiers taking 8 / 14 / 20 / 22 / 18 / 18% of
              the pool. Every grid's description says which of the two it used and lists the rank
              window each tier covers.
            </li>
            <li>
              <b>Role grids</b> — one tier per row, coloured by tier.
            </li>
            <li>
              <b>Total meta</b> — a column per role, a tier per row, each column chained vertically
              and coloured by role, with the strongest heroes overall and the most-banned ones above
              it and the heroes to avoid this patch underneath.
            </li>
            <li>
              <b>Overall tier list</b> — the same six tiers with no role split, one row each.
            </li>
            <li>
              <b>Meta levels</b> — the report's meta layers, oldest first: each row is the heroes
              that define a layer beside the combo pieces that go with them, followed by any layers
              the report projects.
            </li>
          </ul>

          <h3>Personalized grid</h3>
          <p>
            Give it a Steam account id (the Dota friend id) with a public match history and it
            builds a grid around how <i>you</i> play: the report's tiers are re-scored by your
            record on each hero. Three things move a hero — how you do on it, measured against your
            own overall win rate rather than 50%; how much you play it, since a hero with hundreds
            of games behind it is one you can actually pilot, though only while the record holds up;
            and how little you play it, which drags a hero down unless the report already rates it
            near the top. All of it is damped by games played, so a couple of lucky games move
            nothing.
          </p>
          <ul>
            <li>
              <b>Best heroes</b> — the ones you are known for: enough games to mean something and a
              win rate that stands out from the rest of your pool. If nothing stands out you get a
              top few instead.
            </li>
            <li>
              <b>Practice</b> — strong heroes you have hardly played. If you have played everything,
              it relaxes to the strong heroes you play least.
            </li>
            <li>
              <b>Bans</b> — the heroes with the best record against you.
            </li>
            <li>
              <b>Roles</b> — one block each, best-for-you first, optionally ordered by how much you
              play them (judged by your games on each role's heroes).
            </li>
          </ul>
          <p className="muted">Rank-bracket selection and meta tier lists are not wired up yet.</p>
        </section>

        <section className="docs-section">
          <h2>Keyboard shortcuts</h2>
          <p>
            Every shortcut is <b>Alt</b> plus one key, and none of them fire while you are typing in
            a field.
          </p>
          <ul className="docs-format">
            {HOTKEYS.map((h) => (
              <li key={h.keys}>
                <code>{h.keys}</code> — {h.action}
              </li>
            ))}
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
            A single grid is packed into a binary record, deflated, and written as URL-safe base64 —
            typically around a hundred characters, and a fraction of that for large grids.
            Compression is only kept when it actually makes the code shorter, and codes made before
            it was introduced still decode. This is what share links carry (
            <code>/import?b=&lt;code&gt;</code>), what <b>Copy code</b> puts on your clipboard, and
            what the <code>.txt</code> export contains. The record is, in order:
          </p>
          <ul className="docs-format">
            <li>
              <code>version</code> — one byte; the current format is <code>8</code>, and older codes
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
              <code>name</code>, <code>icon</code>, <code>author</code>, <code>description</code> —
              length-prefixed UTF-8 strings (author and description may be empty).
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
            Your whole collection can be exported at once. That is the JSON list below, deflated and
            base64 encoded, as used by <b>Share all</b> and <code>/layouts?l=&lt;code&gt;</code>.
            Compression matters most here — a few grids shrink by well over 90%.
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
              <b>Image</b> — a PNG of the whole grid, 1600px wide, with the grid name, author, description and a QR code linking back to
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
