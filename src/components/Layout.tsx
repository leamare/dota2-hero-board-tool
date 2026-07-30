import { useEffect, useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { APP_VERSION, PARENT_URL, SECTION_HOME } from '../lib/config';
import { migrateLegacyData } from '../lib/firstRun';
import Sidebar from './Sidebar';
import WhatsNewModal from './ui/WhatsNewModal';
import { useUiStore, UI_SCALE_STEPS } from '../state/uiStore';
import { useIsMobile } from '../lib/useIsMobile';
import { MaxColumnsContext, fitColumns } from '../lib/maxColumns';
import { useI18n, LOCALES, type LocaleCode } from '../lib/i18n';

const MENU = [
  { to: '/view', key: 'nav.view', icon: 'grid' },
  { to: '/edit', key: 'nav.edit', icon: 'pen' },
  { to: '/layouts', key: 'nav.layouts', icon: 'stack' },
  { to: '/about', key: 'nav.about', icon: 'info' },
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
  const sidebarPinned = useUiStore((s) => s.sidebarPinned);
  const toggleSidebar = useUiStore((s) => s.toggleOpen);
  const uiScale = useUiStore((s) => s.uiScale);
  const bumpUiScale = useUiStore((s) => s.bumpUiScale);
  const isMobile = useIsMobile();
  const pinned = sidebarPinned && !isMobile;
  const { t, locale, setLocale } = useI18n();
  const { pathname } = useLocation();

  // remember which board tab you were on, so loading a grid reopens it there
  const setLastBoardTab = useUiStore((s) => s.setLastBoardTab);
  useEffect(() => {
    if (pathname.startsWith('/edit')) setLastBoardTab('edit');
    else if (pathname.startsWith('/view')) setLastBoardTab('view');
  }, [pathname, setLastBoardTab]);

  // UI scale multiplies the root font-size, so every rem in the app scales
  useEffect(() => {
    document.documentElement.style.setProperty('--ui-scale', String(uiScale));
  }, [uiScale]);

  // one-time upgrade from the old tool, then the what's-new dialog for this
  // release. runs on mount, after the persisted stores have rehydrated.
  const lastSeenVersion = useUiStore((s) => s.lastSeenVersion);
  const markVersionSeen = useUiStore((s) => s.markVersionSeen);
  const [converted, setConverted] = useState(0);
  const [whatsNew, setWhatsNew] = useState(false);
  useEffect(() => {
    setConverted(migrateLegacyData());
    if (lastSeenVersion !== APP_VERSION) setWhatsNew(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // how many full categories fit across the board area, so the board can cap
  // its column count to what actually fits (recompute on resize/scale/pin)
  const mainRef = useRef<HTMLElement>(null);
  const [maxCols, setMaxCols] = useState(6);
  useLayoutEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const recompute = () => setMaxCols(fitColumns(el));
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    window.addEventListener('resize', recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recompute);
    };
  }, [uiScale, pinned]);

  return (
    <MaxColumnsContext.Provider value={maxCols}>
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
                  <span className="menu-label">{t(m.key)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <select
          id="locale-select"
          name="locale"
          className="locale-select"
          value={locale}
          onChange={(e) => setLocale(e.target.value as LocaleCode)}
          title={t('lang.label')}
          aria-label={t('lang.label')}
        >
          {LOCALES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </header>

      <div className="subheader-bar">
        <span className="ui-scale" title={t('sidebar.uiScale')}>
          <button
            type="button"
            className="ui-scale-btn"
            disabled={uiScale <= UI_SCALE_STEPS[0]}
            onClick={() => bumpUiScale(-1)}
            aria-label={t('sidebar.uiScaleDown')}
          >
            −
          </button>
          <span className="ui-scale-aa" aria-hidden="true">Aa</span>
          <button
            type="button"
            className="ui-scale-btn"
            disabled={uiScale >= UI_SCALE_STEPS[UI_SCALE_STEPS.length - 1]}
            onClick={() => bumpUiScale(1)}
            aria-label={t('sidebar.uiScaleUp')}
          >
            +
          </button>
          <span className="ui-scale-value">{Math.round(uiScale * 100)}%</span>
        </span>
        {!pinned && (
          <button className="subheader-toggle" onClick={toggleSidebar}>
            <MenuIcon name="stack" />
            {t('sidebar.title')}
          </button>
        )}
      </div>

      <Sidebar />

      <main className="app-main" ref={mainRef}>
        <Outlet />
      </main>

      <footer className="app-footer">
        <a href={PARENT_URL}>spectral.gg</a> — Dota 2 Hero Grid Tool
      </footer>

      <WhatsNewModal
        open={whatsNew}
        converted={converted}
        onClose={() => {
          setWhatsNew(false);
          markVersionSeen(APP_VERSION);
        }}
      />
    </div>
    </MaxColumnsContext.Provider>
  );
}
