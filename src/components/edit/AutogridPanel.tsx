import { useState } from 'react';
import {
  REPORTS,
  ROLES,
  buildMetaLevelsGrid,
  buildRoleGrid,
  buildTotalGrid,
  fetchMetaLevels,
  fetchPickban,
  fetchPositions,
  fetchTierList,
  metaLevelsGridName,
  overallGroups,
  roleGridName,
  tierSplit,
  tierSplitFromApi,
  totalGridName,
  withApiFallback,
  type ReportOption,
  type TierSource,
  type TierSplit,
} from '../../lib/autogrid';
import { genId } from '../../lib/board';
import { presetLabel } from '../../lib/constants';
import { useT } from '../../lib/i18n';
import { useBoardStore } from '../../state/boardStore';
import { useLayoutsStore, type SavedLayout } from '../../state/layoutsStore';
import { useMetadata } from '../../state/MetadataProvider';
import { useToast } from '../../state/ToastProvider';

const CUSTOM = '__custom__';

/**
 * Builds tier-list grids from the spectral.gg stats reports: one grid per
 * checked role, plus a combined one with a column per role. Everything is saved
 * to the grid list; the first result is opened.
 */
export default function AutogridPanel() {
  const t = useT();
  const toast = useToast();
  const meta = useMetadata();
  const importLayouts = useLayoutsStore((s) => s.importLayouts);
  const setBoard = useBoardStore((s) => s.setBoard);

  const [reportTag, setReportTag] = useState(REPORTS[0].tag);
  const [customTag, setCustomTag] = useState('');
  const [replaceSameName, setReplaceSameName] = useState(true);
  const [total, setTotal] = useState(true);
  const [metaLevels, setMetaLevels] = useState(false);
  const [roles, setRoles] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  const report: ReportOption =
    reportTag === CUSTOM
      ? { tag: customTag.trim(), label: customTag.trim() }
      : (REPORTS.find((r) => r.tag === reportTag) ?? REPORTS[0]);

  const chosenRoles = ROLES.filter((r) => roles[r.code]);

  const generate = async () => {
    if (!report.tag) return;
    if (!total && !metaLevels && !chosenRoles.length) {
      toast(t('autogrid.pickOne'), 'info');
      return;
    }
    setBusy(true);
    try {
      // a hero the metadata doesn't list would render as a broken portrait
      const known = (id: number) => !!meta?.heroById.has(id);
      const grids: SavedLayout[] = [];
      const wantTiers = total || chosenRoles.length > 0;

      /*
       * Prefer the report's own tier lists: they are filtered and weighted by
       * meta-level membership server-side, which is more than ranking the
       * positions table here can do. Reports without that endpoint (or without
       * the sections it needs) answer with nothing, and then the positions are
       * ranked locally as before.
       */
      let source: TierSource = 'ranking';
      let byRole: Record<string, TierSplit> = {};

      if (wantTiers) {
        const lists = await Promise.all(ROLES.map((r) => fetchTierList(report.tag, r.code)));
        if (lists.every((l) => l)) {
          source = 'tierlist';
          byRole = Object.fromEntries(
            ROLES.map((r, i) => [r.code, tierSplitFromApi(lists[i]!)]),
          );
        } else {
          const positions = await withApiFallback((base) => fetchPositions(report.tag, base));
          byRole = Object.fromEntries(
            ROLES.map((r) => [r.code, tierSplit(positions[r.code] ?? {})]),
          );
        }
      }

      if (total) {
        const pickban = await withApiFallback((base) => fetchPickban(report.tag, base));
        grids.push({
          id: genId(),
          name: totalGridName(report),
          board: buildTotalGrid(byRole, overallGroups(pickban), report, known, undefined, source),
        });
      }
      for (const role of chosenRoles) {
        grids.push({
          id: genId(),
          name: roleGridName(role, report),
          board: buildRoleGrid(role, byRole[role.code], report, known, undefined, source),
        });
      }
      if (metaLevels) {
        const levels = await fetchMetaLevels(report.tag);
        if (!levels) throw new Error(t('autogrid.noMetaLevels'));
        grids.push({
          id: genId(),
          name: metaLevelsGridName(report),
          board: buildMetaLevelsGrid(levels, report, known),
        });
      }

      importLayouts(grids, { replaceSameName });
      // open the first one, tracking whichever layout it ended up as
      const saved = useLayoutsStore
        .getState()
        .layouts.find((l) => l.name === grids[0].name);
      setBoard({ ...grids[0].board }, saved?.id ?? null);
      toast(t('autogrid.done').replace('{n}', String(grids.length)));
    } catch (err) {
      toast(`${t('autogrid.failed')}: ${err instanceof Error ? err.message : String(err)}`, 'info');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h3>{t('autogrid.generated')}</h3>
      <div className="field row">
        <label>{t('autogrid.report')}</label>
        <select className="select" value={reportTag} onChange={(e) => setReportTag(e.target.value)}>
          {REPORTS.map((r) => (
            <option key={r.tag} value={r.tag}>
              {r.label}
            </option>
          ))}
          <option value={CUSTOM}>{t('autogrid.customTag')}</option>
        </select>
      </div>
      {reportTag === CUSTOM && (
        <div className="field row">
          <input
            className="input"
            value={customTag}
            placeholder={t('autogrid.customTagPlaceholder')}
            onChange={(e) => setCustomTag(e.target.value)}
          />
        </div>
      )}

      <p className="field-hint">{t('autogrid.grids')}</p>
      <label className="checkbox">
        <input type="checkbox" checked={total} onChange={(e) => setTotal(e.target.checked)} />
        {t('autogrid.total')}
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={metaLevels}
          onChange={(e) => setMetaLevels(e.target.checked)}
        />
        {t('autogrid.metaLevels')}
      </label>
      {ROLES.map((role) => (
        <label className="checkbox" key={role.code}>
          <input
            type="checkbox"
            checked={!!roles[role.code]}
            onChange={(e) => setRoles((r) => ({ ...r, [role.code]: e.target.checked }))}
          />
          {presetLabel(role.preset)}
        </label>
      ))}

      <label className="checkbox">
        <input
          type="checkbox"
          checked={replaceSameName}
          onChange={(e) => setReplaceSameName(e.target.checked)}
        />
        {t('autogrid.replaceSame')}
      </label>

      <div className="sidebar-actions">
        <button className="btn small primary" disabled={busy || !report.tag} onClick={generate}>
          {busy ? t('autogrid.generating') : t('autogrid.generate')}
        </button>
      </div>

      {/* not wired to anything yet — shown so the shape of the feature is clear */}
      <div className="field row">
        <label>{t('autogrid.tierList')}</label>
        <select className="select" disabled>
          <option>{t('autogrid.soon')}</option>
        </select>
      </div>
      <div className="field row">
        <label>{t('autogrid.accountId')}</label>
        <input className="input" disabled placeholder={t('autogrid.soon')} />
      </div>
      <p className="field-hint">{t('autogrid.personalization')} — {t('autogrid.soon')}</p>
    </>
  );
}
