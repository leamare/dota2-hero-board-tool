import { useState } from 'react';
import Modal from '../ui/Modal';
import CategoryIconModal from './CategoryIconModal';
import { useBoardStore } from '../../state/boardStore';
import { LABEL_COLORS, PRESET_NAMES, WIDENESS_OPTIONS, widenessLabel } from '../../lib/constants';
import { useT } from '../../lib/i18n';
import { ITEM_STYLES, PORTRAIT_TYPES, SIZE_OPTIONS } from '../../lib/images';
import { useMetadata } from '../../state/MetadataProvider';
import type { CategoryIcon } from '../../types/board';

interface Props {
  categoryId: string | null;
  onClose: () => void;
}

const HEADER_SIZES = [
  { value: 0, label: 'Small' },
  { value: 1, label: 'Normal' },
  { value: 2, label: 'Large' },
  { value: 3, label: 'Huge' },
];

export default function CategorySettingsModal({ categoryId, onClose }: Props) {
  const t = useT();
  const category = useBoardStore((s) => s.board.categories.find((c) => c.id === categoryId));
  const columns = useBoardStore((s) => s.board.columns);
  const patchCategory = useBoardStore((s) => s.patchCategory);
  const meta = useMetadata();
  const [iconPicker, setIconPicker] = useState(false);

  if (!category) return null;
  const icon = category.icon;
  const usePreset = category.preset !== undefined;
  const patchIcon = (patch: Partial<CategoryIcon>) =>
    icon && patchCategory(category.id, { icon: { ...icon, ...patch } });

  const iconHero =
    icon?.kind === 'hero' && icon.refId != null ? meta?.heroById.get(icon.refId) : undefined;

  return (
    <>
      <Modal open onClose={onClose} title={t('cat.settings')} width="32rem">
        <div className="settings-grid">
          <div className="field">
            <label>{t('cat.label')}</label>
            <select
              className="select"
              value={usePreset ? 'preset' : 'text'}
              onChange={(e) =>
                e.target.value === 'preset'
                  ? patchCategory(category.id, { preset: category.preset ?? 1, text: undefined })
                  : patchCategory(category.id, { preset: undefined, text: category.text ?? '' })
              }
            >
              <option value="text">{t('cat.text')}</option>
              <option value="preset">{t('cat.preset')}</option>
            </select>
          </div>

          {usePreset ? (
            <div className="field">
              <label>{t('cat.preset')}</label>
              <select
                className="select"
                value={category.preset ?? 1}
                onChange={(e) => patchCategory(category.id, { preset: Number(e.target.value) })}
              >
                {PRESET_NAMES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {t(`preset.${p.value}`)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="field">
              <label>{t('cat.labelText')}</label>
              <input
                className="input"
                value={category.text ?? ''}
                onChange={(e) => patchCategory(category.id, { text: e.target.value })}
              />
            </div>
          )}

          <div className="field">
            <label>{t('cat.icon')}</label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button className="btn" onClick={() => setIconPicker(true)}>
                {icon ? 'Change…' : 'Set icon…'}
              </button>
              {icon && (
                <button
                  className="btn danger"
                  onClick={() => patchCategory(category.id, { icon: undefined })}
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {(icon?.kind === 'hero' || icon?.kind === 'item') && (
            <div className="field">
              <label>{t('cat.iconStyle')}</label>
              <select
                className="select"
                value={icon.iconType ?? 2}
                onChange={(e) => patchIcon({ iconType: Number(e.target.value) })}
              >
                {PORTRAIT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {icon?.kind === 'hero' && (iconHero?.alticons.length ?? 0) > 0 && (
            <div className="field">
              <label>{t('cat.iconVariant')}</label>
              <select
                className="select"
                value={icon.alticon ?? ''}
                onChange={(e) => patchIcon({ alticon: e.target.value || null })}
              >
                <option value="">{t('cat.default')}</option>
                {iconHero!.alticons.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label>{t('cat.headerSize')}</label>
            <select
              className="select"
              value={category.headerSize ?? 1}
              onChange={(e) => patchCategory(category.id, { headerSize: Number(e.target.value) })}
            >
              {HEADER_SIZES.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>{t('cat.labelColour')}</label>
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
            <label>{t('cat.width')}</label>
            <select
              className="select"
              value={category.wideness}
              onChange={(e) => patchCategory(category.id, { wideness: Number(e.target.value) })}
            >
              {WIDENESS_OPTIONS.map((i) => (
                <option key={i} value={i}>
                  {widenessLabel(i, columns)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>{t('sidebar.portraits')}</label>
            <select
              className="select"
              value={category.portraitType ?? ''}
              onChange={(e) =>
                patchCategory(category.id, {
                  portraitType: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            >
              <option value="">{t('cat.boardDefault')}</option>
              {PORTRAIT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>{t('sidebar.size')}</label>
            <select
              className="select"
              value={category.size ?? ''}
              onChange={(e) =>
                patchCategory(category.id, {
                  size: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            >
              <option value="">{t('cat.boardDefault')}</option>
              {SIZE_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>{t('sidebar.items')}</label>
            <select
              className="select"
              value={category.itemStyle ?? ''}
              onChange={(e) =>
                patchCategory(category.id, {
                  itemStyle: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            >
              <option value="">{t('cat.boardDefault')}</option>
              {ITEM_STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="settings-toggles">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={!!category.newRow}
              onChange={(e) => patchCategory(category.id, { newRow: e.target.checked })}
            />
            Start on a new row
          </label>
        </div>
      </Modal>

      <CategoryIconModal
        categoryId={iconPicker ? category.id : null}
        onClose={() => setIconPicker(false)}
      />
    </>
  );
}
