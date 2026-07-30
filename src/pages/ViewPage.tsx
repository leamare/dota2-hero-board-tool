import { useState } from 'react';
import { Link } from 'react-router-dom';
import BoardView from '../components/board/BoardView';
import BoardHeading from '../components/board/BoardHeading';
import ShareModal from '../components/edit/ShareModal';
import ShareImageModal from '../components/board/ShareImageModal';
import { useBoardStore } from '../state/boardStore';
import { useMetadataState } from '../state/MetadataProvider';

export default function ViewPage() {
  const board = useBoardStore((s) => s.board);
  const { data, error } = useMetadataState();
  const [shareOpen, setShareOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  if (error) return <div className="text-panel">Failed to load metadata: {error}</div>;
  if (!data) return <div className="text-panel">Loading hero metadata…</div>;

  return (
    <div className="view-page">
      <BoardHeading
        board={board}
        actions={
          <>
            <Link className="btn" to="/edit">
              Edit
            </Link>
            <button className="btn" onClick={() => setImageOpen(true)}>
              Image
            </button>
            <button className="btn primary" onClick={() => setShareOpen(true)}>
              Share
            </button>
          </>
        }
      />
      <BoardView board={board} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
      <ShareImageModal open={imageOpen} onClose={() => setImageOpen(false)} board={board} />
    </div>
  );
}
