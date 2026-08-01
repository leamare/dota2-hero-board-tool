import { useT } from '../../lib/i18n';

interface Props {
  onImport: () => void;
  onExport: () => void;
}

/** The hero_grid_config.json import/export pair, shown on two sidebar tabs. */
export default function GameConfigButtons({ onImport, onExport }: Props) {
  const t = useT();
  return (
    <div className="sidebar-actions">
      <button className="btn small" title={t('sidebar.gameFileHint')} onClick={onImport}>
        {t('sidebar.gameImport')}
      </button>
      <button className="btn small" title={t('sidebar.gameFileHint')} onClick={onExport}>
        {t('sidebar.gameExport')}
      </button>
    </div>
  );
}
