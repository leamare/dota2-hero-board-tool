import { Fragment, useState } from 'react';
import CategoryCard from '../board/CategoryCard';
import Picker from './Picker';
import CategorySettingsModal from './CategorySettingsModal';
import { useBoardStore } from '../../state/boardStore';

export default function EditableBoard() {
  const board = useBoardStore((s) => s.board);
  const removeCategory = useBoardStore((s) => s.removeCategory);
  const removeElement = useBoardStore((s) => s.removeElement);
  const addElement = useBoardStore((s) => s.addElement);

  const [pickerCat, setPickerCat] = useState<string | null>(null);
  const [settingsCat, setSettingsCat] = useState<string | null>(null);

  return (
    <div
      className={[
        'board',
        board.centered ? 'centered' : '',
        board.darkenedBg ? 'darkened' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {board.categories.map((cat) => (
        <Fragment key={cat.id}>
          {cat.newRow && <div className="row-break" />}
          <CategoryCard
            category={cat}
            board={board}
            headerControls={
              <span className="cat-controls">
                <button
                  className="btn small"
                  title="Settings"
                  onClick={() => setSettingsCat(cat.id)}
                >
                  ⚙
                </button>
                <button
                  className="btn small danger"
                  title="Delete category"
                  onClick={() => removeCategory(cat.id)}
                >
                  ✕
                </button>
              </span>
            }
            renderElementOverlay={(index) => (
              <button
                className="portrait-remove"
                title="Remove"
                onClick={() => removeElement(cat.id, index)}
              />
            )}
            bodyExtra={
              <button
                className="portrait add-tile"
                title="Add hero or item"
                onClick={() => setPickerCat(cat.id)}
              >
                +
              </button>
            }
          />
          {cat.separatorAfter && <div className="separator" />}
        </Fragment>
      ))}

      <Picker
        open={pickerCat !== null}
        keepOpen
        onClose={() => setPickerCat(null)}
        onPick={(kind, refId) => pickerCat && addElement(pickerCat, { kind, refId })}
      />
      <CategorySettingsModal categoryId={settingsCat} onClose={() => setSettingsCat(null)} />
    </div>
  );
}
