import { describe, expect, it } from 'vitest';
import { rich } from './Rich';
import type { ReactElement } from 'react';

const parts = (text: string) =>
  rich(text).map((n) => {
    const el = n as ReactElement<{ children?: unknown; to?: string; href?: string }>;
    return { type: typeof el.type === 'string' ? el.type : 'component', props: el.props };
  });

describe('rich text', () => {
  it('renders bold and code spans', () => {
    const out = parts('a **b** and `c`');
    expect(out.map((p) => p.type)).toEqual(['component', 'b', 'component', 'code']);
    expect(out[1].props.children).toBe('b');
    expect(out[3].props.children).toBe('c');
  });

  it('links out for urls and routes internally for paths', () => {
    const [external] = parts('[site](https://example.com)');
    expect(external.type).toBe('a');
    expect(external.props.href).toBe('https://example.com');

    const [internal] = parts('[grids](/layouts)');
    // react-router's Link, so the app doesn't reload on a docs link
    expect(internal.type).toBe('component');
    expect(internal.props.to).toBe('/layouts');
  });

  it('turns a spaced double dash into an em dash', () => {
    const [only] = parts('a -- b');
    expect(only.props.children).toBe('a — b');
  });

  it('leaves the game grid break marker alone', () => {
    // `------` is a literal category name in the docs, not punctuation
    const [only] = parts('blocks named ------ here');
    expect(only.props.children).toBe('blocks named ------ here');
  });

  it('leaves unmatched markup alone rather than dropping it', () => {
    const out = parts('a [broken( link ** here');
    expect(out).toHaveLength(1);
    expect(out[0].props.children).toBe('a [broken( link ** here');
  });
});
