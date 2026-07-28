import type { ChainSides } from '../../lib/layout';

/**
 * Small bars drawn in the grid gap toward a linked partner, so chained
 * categories read as connected even though they are separate cells.
 */
export default function ChainConnectors({ chain }: { chain?: ChainSides }) {
  if (!chain) return null;
  return (
    <>
      {chain.right && <span className="chain-conn chain-right" aria-hidden="true" />}
      {chain.down && <span className="chain-conn chain-down" aria-hidden="true" />}
    </>
  );
}
