import { NavLink, Outlet } from 'react-router-dom';

const MENU = [
  { to: '/view', label: 'View' },
  { to: '/edit', label: 'Edit' },
  { to: '/about', label: 'About' },
];

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <a
          className="brand"
          href="https://spectral.gg"
          title="spectral.gg"
          aria-label="spectral.gg"
        />
        <nav className="app-menu">
          {MENU.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              <span>{m.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="header-tools" />
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <a href="https://spectral.gg">spectral.gg</a> — Dota 2 Hero Grid Tool
      </footer>
    </div>
  );
}
