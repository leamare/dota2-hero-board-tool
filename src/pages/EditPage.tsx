import BoardToolbar from '../components/edit/BoardToolbar';
import EditableBoard from '../components/edit/EditableBoard';
import { useBoardStore } from '../state/boardStore';
import { useMetadataState } from '../state/MetadataProvider';

export default function EditPage() {
  const board = useBoardStore((s) => s.board);
  const { data, error } = useMetadataState();

  if (error) return <div className="text-panel">Failed to load metadata: {error}</div>;
  if (!data) return <div className="text-panel">Loading hero metadata…</div>;

  return (
    <div className="edit-page">
      <BoardToolbar />
      {board.categories.length === 0 && (
        <p className="board-empty">Add a category to start building your grid.</p>
      )}
      <EditableBoard />
    </div>
  );
}
