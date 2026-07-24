import type { ReactElement } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { PARENT_URL, SECTION_HOME } from '../lib/config';
import Sidebar from './Sidebar';
import { useUiStore } from '../state/uiStore';

const MENU = [
  { to: '/view', label: 'View', icon: 'grid' },
  { to: '/edit', label: 'Edit', icon: 'pen' },
  { to: '/layouts', label: 'Layouts', icon: 'stack' },
  { to: '/about', label: 'About', icon: 'info' },
] as const;

const ICONS: Record<string, ReactElement> = {
  grid: <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />,
  pen: <path d="M4 20h4L20 8l-4-4L4 16zM14 6l4 4" fill="none" stroke="currentColor" strokeWidth="2" />,
  stack: <path d="M12 2 2 7l10 5 10-5zM2 12l10 5 10-5M2 17l10 5 10-5" fill="none" stroke="currentColor" strokeWidth="2" />,
  info: <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 5a1.3 1.3 0 110 2.6A1.3 1.3 0 0112 7zm-1.3 5h2.6v6h-2.6z" />,
};

const MenuIcon = ({ name }: { name: string }) => (
  <svg className="menu-icon" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

export default function Layout() {
  const pinned = useUiStore((s) => s.sidebarPinned);
  return (
    <div className={`app-shell${pinned ? ' sb-pinned' : ''}`}>
      <header className="app-header">
        <a className="root-link" href={PARENT_URL} title="To main site" />
        <Link className="gotomain" to={SECTION_HOME} title="Hero Grid Tool" aria-label="Home" />
        <nav className="header-links">
          <input id="menu-toggle" type="checkbox" className="menu-toggle" />
          <label htmlFor="menu-toggle" className="menu-toggle-button" aria-label="Menu">
            <span className="burger" />
          </label>
          <ul className="menu">
            {MENU.map((m) => (
              <li key={m.to}>
                <NavLink to={m.to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                  <MenuIcon name={m.icon} />
                  <span className="menu-label">{m.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <Sidebar />

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <a href={PARENT_URL}>spectral.gg</a> — Dota 2 Hero Grid Tool
      </footer>
    </div>
  );
}
