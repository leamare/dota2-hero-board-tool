import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BoardView from '../components/board/BoardView';
import { decodeBoard } from '../lib/share';
import { useBoardStore } from '../state/boardStore';
import { useMetadataState } from '../state/MetadataProvider';
import type { Board } from '../types/board';

export default function ImportPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setBoard = useBoardStore((s) => s.setBoard);
  const { data, error: metaError } = useMetadataState();

  const code = params.get('b') ?? '';
  const { board, error } = useMemo<{ board: Board | null; error: string | null }>(() => {
    if (!code) return { board: null, error: 'No grid data in this link.' };
    try {
      return { board: decodeBoard(code), error: null };
    } catch (e) {
      return { board: null, error: e instanceof Error ? e.message : 'Could not read this link.' };
    }
  }, [code]);

  if (error) return <div className="text-panel">Import failed: {error}</div>;
  if (metaError) return <div className="text-panel">Failed to load metadata: {metaError}</div>;
  if (!board || !data) return <div className="text-panel">Loading…</div>;

  const load = () => {
    setBoard(board);
    navigate('/view');
  };

  return (
    <div className="import-page">
      <div className="toolbar">
        <span className="import-title">Imported grid: <strong>{board.name}</strong></span>
        <div className="sep" />
        <button className="btn primary" onClick={load}>Load this grid</button>
        <button className="btn" onClick={() => navigate('/view')}>Cancel</button>
      </div>
      <BoardView board={board} />
    </div>
  );
}
