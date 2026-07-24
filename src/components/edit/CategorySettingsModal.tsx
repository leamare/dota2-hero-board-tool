import { useState } from 'react';
import Modal from '../ui/Modal';
import Picker from './Picker';
import { useBoardStore } from '../../state/boardStore';
import { LABEL_COLORS, PRESET_NAMES, WIDENESS } from '../../lib/constants';
import { stylesForKind } from '../../lib/images';
import type { CategoryNameType } from '../../types/board';

interface Props {
  categoryId: string | null;
  onClose: () => void;
}

export default function CategorySettingsModal({ categoryId, onClose }: Props) {
  const category = useBoardStore((s) =>
    s.board.categories.find((c) => c.id === categoryId),
  );
  const patchCategory = useBoardStore((s) => s.patchCategory);
  const [iconPicker, setIconPicker] = useState(false);

  if (!category) return null;
  const name = category.name;
  const isIcon = name.type === 'hero' || name.type === 'item';

  const setNameType = (type: CategoryNameType | 'icon') => {
    if (type === 'icon') {
      setIconPicker(true);
      return;
    }
    if (type === 'preset') {
      patchCategory(category.id, { name: { type: 'preset', preset: name.preset ?? 1 } });
    } else {
      patchCategory(category.id, { name: { type: 'text', text: name.text ?? '' } });
    }
  };

  const currentNameMode: 'text' | 'preset' | 'icon' = isIcon
    ? 'icon'
    : (name.type as 'text' | 'preset');

  return (
    <>
      <Modal open onClose={onClose} title="Category settings" width="30rem">
        <div className="field">
          <label>Label type</label>
          <select
            className="select"
            value={currentNameMode}
            onChange={(e) => setNameType(e.target.value as CategoryNameType | 'icon')}
          >
            <option value="text">Text</option>
            <option value="preset">Preset</option>
            <option value="icon">Hero / item icon</option>
          </select>
        </div>

        {name.type === 'text' && (
          <div className="field">
            <label>Label text</label>
            <input
              className="input"
              value={name.text ?? ''}
              onChange={(e) =>
                patchCategory(category.id, { name: { type: 'text', text: e.target.value } })
              }
            />
          </div>
        )}

        {name.type === 'preset' && (
          <div className="field">
            <label>Preset</label>
            <select
              className="select"
              value={name.preset ?? 1}
              onChange={(e) =>
                patchCategory(category.id, {
                  name: { type: 'preset', preset: Number(e.target.value) },
                })
              }
            >
              {PRESET_NAMES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {isIcon && (
          <div className="field">
            <label>Icon label</label>
            <button className="btn" onClick={() => setIconPicker(true)}>
              Change icon…
            </button>
          </div>
        )}

        <div className="field">
          <label>Label colour</label>
          <select
            className="select"
            value={category.color}
            onChange={(e) => patchCategory(category.id, { color: e.target.value })}
          >
            {LABEL_COLORS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Width</label>
          <select
            className="select"
            value={category.wideness}
            onChange={(e) => patchCategory(category.id, { wideness: Number(e.target.value) })}
          >
            {WIDENESS.map((w, i) => (
              <option key={i} value={i}>
                {w.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Hero style override</label>
          <select
            className="select"
            value={category.heroStyle ?? ''}
            onChange={(e) =>
              patchCategory(category.id, {
                heroStyle: e.target.value === '' ? undefined : Number(e.target.value),
              })
            }
          >
            <option value="">— board default —</option>
            {stylesForKind('hero').map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Item style override</label>
          <select
            className="select"
            value={category.itemStyle ?? ''}
            onChange={(e) =>
              patchCategory(category.id, {
                itemStyle: e.target.value === '' ? undefined : Number(e.target.value),
              })
            }
          >
            <option value="">— board default —</option>
            {stylesForKind('item').map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={category.bigger}
            onChange={(e) => patchCategory(category.id, { bigger: e.target.checked })}
          />
          Bigger portraits
        </label>
        <br />
        <label className="checkbox">
          <input
            type="checkbox"
            checked={!!category.newRow}
            onChange={(e) => patchCategory(category.id, { newRow: e.target.checked })}
          />
          Start on a new row
        </label>
        <br />
        <label className="checkbox">
          <input
            type="checkbox"
            checked={!!category.separatorAfter}
            onChange={(e) => patchCategory(category.id, { separatorAfter: e.target.checked })}
          />
          Dashed separator after
        </label>
      </Modal>

      <Picker
        open={iconPicker}
        onClose={() => setIconPicker(false)}
        onPick={(kind, refId) =>
          patchCategory(category.id, { name: { type: kind, refId } })
        }
      />
    </>
  );
}
