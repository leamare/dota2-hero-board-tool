import BoardView from '../components/board/BoardView';
import { useBoardStore } from '../state/boardStore';
import { useMetadataState } from '../state/MetadataProvider';

export default function ViewPage() {
  const board = useBoardStore((s) => s.board);
  const { data, error } = useMetadataState();

  if (error) return <div className="text-panel">Failed to load metadata: {error}</div>;
  if (!data) return <div className="text-panel">Loading hero metadata…</div>;

  return (
    <div className="view-page">
      <h1 className="board-name">{board.name}</h1>
      <BoardView board={board} />
    </div>
  );
}
