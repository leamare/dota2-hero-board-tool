import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PORTRAIT_TYPE,
  SIZES,
  SIZE_OPTIONS,
  VERTICAL_PORTRAITS,
  isAutoSize,
  sizeRem,
} from './images';

const byLabel = (label: string) => SIZES.find((s) => s.label === label)!;

describe('portrait sizes', () => {
  it('gives vertical portraits the next step up', () => {
    // a vertical portrait at a given step is as tall as the next horizontal one
    const ladder = ['Mini', 'Small', 'Medium', 'Large', 'Huge', 'Massive'];
    for (let i = 0; i < ladder.length - 1; i++) {
      const step = byLabel(ladder[i]);
      const next = byLabel(ladder[i + 1]);
      expect(sizeRem(step.id, VERTICAL_PORTRAITS)).toBe(next.rem);
    }
  });

  it('leaves horizontal portraits and icons on the base scale', () => {
    for (const step of SIZES) {
      expect(sizeRem(step.id, DEFAULT_PORTRAIT_TYPE)).toBe(step.rem);
    }
  });

  it('keeps Mini at the bottom of the scale', () => {
    const mini = byLabel('Mini');
    expect(mini.rem).toBeLessThan(byLabel('Small').rem);
    // ...and matches what Small used to be for vertical portraits
    expect(sizeRem(mini.id, VERTICAL_PORTRAITS)).toBe(2.4);
  });

  it('appends new steps so saved size ids keep their meaning', () => {
    expect(SIZES.map((s) => s.id)).toEqual(SIZES.map((_, i) => i));
    expect(byLabel('Small').id).toBe(0);
    expect(byLabel('Autoscale').id).toBe(6);
    expect(byLabel('Mini').id).toBe(7);
  });

  it('offers every step in menu order, smallest first', () => {
    expect(SIZE_OPTIONS).toHaveLength(SIZES.length);
    expect(SIZE_OPTIONS.map((s) => s.label)).toEqual([
      'Mini',
      'Small',
      'Medium',
      'Large',
      'Huge',
      'Massive',
      'Absolute Unit',
      'Autoscale',
    ]);
    // the stretching step is last and is the only auto one
    expect(SIZE_OPTIONS.filter((s) => isAutoSize(s.id))).toEqual([byLabel('Autoscale')]);
  });

  it('falls back to the default step for an unknown id', () => {
    expect(sizeRem(99, DEFAULT_PORTRAIT_TYPE)).toBe(SIZES[0].rem);
  });
});
