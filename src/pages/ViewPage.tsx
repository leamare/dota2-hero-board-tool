import { useState } from 'react';
import { Link } from 'react-router-dom';
import BoardView from '../components/board/BoardView';
import GridIcon from '../components/GridIcon';
import ShareModal from '../components/edit/ShareModal';
import { useBoardStore } from '../state/boardStore';
import { useMetadataState } from '../state/MetadataProvider';

export default function ViewPage() {
  const board = useBoardStore((s) => s.board);
  const { data, error } = useMetadataState();
  const [shareOpen, setShareOpen] = useState(false);

  if (error) return <div className="text-panel">Failed to load metadata: {error}</div>;
  if (!data) return <div className="text-panel">Loading hero metadata…</div>;

  return (
    <div className="view-page">
      <div className={`view-head${board.centered ? ' centered' : ''}`}>
        <h1 className="board-name">
          <GridIcon tag={board.icon} />
          {board.name}
        </h1>
        <div className="view-actions">
          <Link className="btn" to="/edit">
            Edit
          </Link>
          <button className="btn primary" onClick={() => setShareOpen(true)}>
            Share
          </button>
        </div>
      </div>
      <BoardView board={board} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
