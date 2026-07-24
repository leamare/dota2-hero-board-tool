export default function AboutPage() {
  return (
    <div className="text-panel">
      <h1>About</h1>
      <p>
        <b>Hero Grid Tool</b> is an "alt-tab" tool for creating and customizing
        Dota 2 hero layouts.
      </p>
      <p>
        You can use it as a personal notebook to create and customize categories
        however you want to keep track of your own thoughts.
      </p>
      <p>
        Use the "Edit" tab to customize your hero layouts. You can create new
        categories and layouts as well as rearrange and customize them. And of
        course you can add heroes — and now items — to them using the adding
        dialog or by dragging portraits around.
      </p>
      <hr />
      <p>The board is made out of layouts which you can create, delete or import.</p>
      <p>
        Every layout is empty by default, but you can add new categories to it and
        fill them with heroes and items using the adding menu.
      </p>
      <p>
        You can also drag heroes around the categories, rename categories, add
        colour tags to them, pick portrait styles, and swap in alternate hero
        portraits.
      </p>
      <p>
        Your whole board is saved in your browser's local storage. But you can
        also export your board to a file, export a single layout, or just share it
        with a compact link.
      </p>
      <hr />
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
        .
      </p>
    </div>
  );
}
