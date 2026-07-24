import EditableBoard from '../components/edit/EditableBoard';
import GridIcon from '../components/GridIcon';
import { useBoardStore } from '../state/boardStore';
import { useMetadataState } from '../state/MetadataProvider';
import { useT } from '../lib/i18n';

export default function EditPage() {
  const board = useBoardStore((s) => s.board);
  const addCategory = useBoardStore((s) => s.addCategory);
  const { data, error } = useMetadataState();
  const t = useT();

  if (error) return <div className="text-panel">Failed to load metadata: {error}</div>;
  if (!data) return <div className="text-panel">Loading hero metadata…</div>;

  return (
    <div className="edit-page">
      <div className={`view-head${board.centered ? ' centered' : ''}`}>
        <h1 className="board-name">
          <GridIcon tag={board.icon} />
          {board.name || 'Untitled grid'}
        </h1>
        <div className="view-actions">
          <button className="btn primary" onClick={addCategory}>
            ＋ {t('common.category')}
          </button>
        </div>
      </div>
      {board.categories.length === 0 && (
        <p className="board-empty">{t('edit.addCategoryHint')}</p>
      )}
      <EditableBoard />
    </div>
  );
}
