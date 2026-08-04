import { useState } from 'react';
import {
  REPORTS,
  ROLES,
  buildMetaLevelsGrid,
  buildOverallGrid,
  buildRoleGrid,
  buildTotalGrid,
  fetchMetaLevels,
  fetchPickban,
  fetchPositions,
  fetchTierList,
  MEDIAN_FLOOR,
  metaLevelsGridName,
  overallGridName,
  overallGroups,
  roleGridName,
  splitRanked,
  tierSplit,
  tierSplitFromApi,
  totalGridName,
  withApiFallback,
  type ReportOption,
  type TierSource,
  type TierSplit,
} from '../../lib/autogrid';
import {
  buildPersonalGrid,
  fetchPlayerHeroes,
  personalGridName,
  personalise,
  ranksFromSplit,
  retier,
} from '../../lib/personal';
import { genId } from '../../lib/board';
import { presetLabel } from '../../lib/constants';
import { useT } from '../../lib/i18n';
import { useBoardStore } from '../../state/boardStore';
import { useLayoutsStore, type SavedLayout } from '../../state/layoutsStore';
import { useMetadata } from '../../state/MetadataProvider';
import { useUiStore } from '../../state/uiStore';
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
  const [overall, setOverall] = useState(false);
  const [roles, setRoles] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const accountId = useUiStore((s) => s.accountId);
  const setAccountId = useUiStore((s) => s.setAccountId);
  const [sortRoles, setSortRoles] = useState(false);
  const [busyPersonal, setBusyPersonal] = useState(false);

  const report: ReportOption =
    reportTag === CUSTOM
      ? { tag: customTag.trim(), label: customTag.trim() }
      : (REPORTS.find((r) => r.tag === reportTag) ?? REPORTS[0]);

  const chosenRoles = ROLES.filter((r) => roles[r.code]);

  /** Per-role tiers, from the report's own lists when it has them. */
  const roleTiers = async (): Promise<{ byRole: Record<string, TierSplit>; source: TierSource }> => {
    const lists = await Promise.all(ROLES.map((r) => fetchTierList(report.tag, r.code)));
    if (lists.every((l) => l)) {
      return {
        source: 'tierlist',
        byRole: Object.fromEntries(ROLES.map((r, i) => [r.code, tierSplitFromApi(lists[i]!)])),
      };
    }
    const positions = await withApiFallback((base) => fetchPositions(report.tag, base));
    return {
      source: 'ranking',
      byRole: Object.fromEntries(ROLES.map((r) => [r.code, tierSplit(positions[r.code] ?? {})])),
    };
  };

  /**
   * The personal grid: the report's tiers, re-scored against what this account
   * actually plays. Needs the overall list for the practice block and the per
   * role ones for the role blocks.
   */
  const generatePersonal = async () => {
    const id = accountId.trim();
    if (!id) return;
    setBusyPersonal(true);
    try {
      const [heroes, overallList, roles] = await Promise.all([
        fetchPlayerHeroes(id),
        fetchTierList(report.tag),
        roleTiers(),
      ]);

      const known = (hid: number) => !!meta?.heroById.has(hid);
      const overallSplit = overallList
        ? tierSplitFromApi(overallList)
        : // no overall list: pool every role's tiers as a stand-in
          retier(
            personalise(
              new Map(
                ROLES.flatMap((r) => [...ranksFromSplit(roles.byRole[r.code] ?? { buckets: [], ranges: [] })]),
              ),
              heroes,
            ),
          );

      const scoredOverall = personalise(ranksFromSplit(overallSplit), heroes);
      const byRole = Object.fromEntries(
        ROLES.map((r) => [
          r.code,
          retier(personalise(ranksFromSplit(roles.byRole[r.code] ?? { buckets: [], ranges: [] }), heroes)),
        ]),
      );

      const board = buildPersonalGrid(
        { accountId: id, report, heroes, overall: scoredOverall, byRole, source: roles.source, sortRoles },
        known,
      );
      const grid = { id: genId(), name: personalGridName(id), board };
      importLayouts([grid], { replaceSameName });
      const saved = useLayoutsStore.getState().layouts.find((l) => l.name === grid.name);
      setBoard({ ...board }, saved?.id ?? null);
      toast(t('autogrid.done').replace('{n}', '1'));
    } catch (err) {
      toast(`${t('autogrid.failed')}: ${err instanceof Error ? err.message : String(err)}`, 'info');
    } finally {
      setBusyPersonal(false);
    }
  };

  const generate = async () => {
    if (!report.tag) return;
    if (!total && !metaLevels && !overall && !chosenRoles.length) {
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
        ({ byRole, source } = await roleTiers());
      }

      if (overall) {
        const list = await fetchTierList(report.tag);
        if (list) {
          grids.push({
            id: genId(),
            name: overallGridName(report),
            board: buildOverallGrid(tierSplitFromApi(list), report, known, undefined, 'tierlist'),
          });
        } else {
          // no tier list for this report — rank the report-wide table instead
          const pickban = await withApiFallback((base) => fetchPickban(report.tag, base));
          const ranked = Object.entries(pickban)
            .map(([id, st]) => ({ id: Number(id), rank: Number(st.rank), picks: Number(st.picks_to_median) }))
            .filter((r) => r.picks >= MEDIAN_FLOOR && Number.isFinite(r.rank))
            .sort((a, b) => b.rank - a.rank);
          grids.push({
            id: genId(),
            name: overallGridName(report),
            board: buildOverallGrid(splitRanked(ranked), report, known, undefined, 'ranking'),
          });
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
        <input type="checkbox" checked={overall} onChange={(e) => setOverall(e.target.checked)} />
        {t('autogrid.overall')}
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

      <h3>{t('autogrid.personalization')}</h3>
      <p className="field-hint">{t('autogrid.personalHint')}</p>
      <div className="field row">
        <label>{t('autogrid.accountId')}</label>
        <input
          className="input"
          value={accountId}
          placeholder="123456789"
          inputMode="numeric"
          onChange={(e) => setAccountId(e.target.value.replace(/[^0-9]/g, ''))}
        />
      </div>
      <label className="checkbox">
        <input type="checkbox" checked={sortRoles} onChange={(e) => setSortRoles(e.target.checked)} />
        {t('autogrid.sortRoles')}
      </label>
      <div className="sidebar-actions">
        <button
          className="btn small primary"
          disabled={busyPersonal || !accountId.trim() || !report.tag}
          onClick={generatePersonal}
        >
          {busyPersonal ? t('autogrid.generating') : t('autogrid.generatePersonal')}
        </button>
      </div>

    </>
  );
}
