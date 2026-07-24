export default function AboutPage() {
  return (
    <div className="text-panel">
      <h1>Dota 2 Hero Grid Tool</h1>
      <p>
        Build custom hero grids, arrange them into categories, and share them
        with a single link. A modern rebuild of the original tool in TypeScript
        and React.
      </p>
      <ul>
        <li>Group heroes and items into coloured, labelled categories.</li>
        <li>
          Choose how portraits look — wide, tall, square icons — per board or
          per category, and swap in alternate hero portraits (personas, arcanas).
        </li>
        <li>Add items as grid entries or use hero/item icons as category labels.</li>
        <li>Line categories up with separators and custom widths.</li>
        <li>Reorder everything by dragging.</li>
        <li>Share a whole grid in a short link — no account, no server.</li>
      </ul>
      <p>
        Hero and item data come from the{' '}
        <a href="https://stats.spectral.gg">spectral LRG2 API</a>; images from the
        spectral courier CDN.
      </p>
    </div>
  );
}
