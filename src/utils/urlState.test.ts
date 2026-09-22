import { describe, expect, it } from 'vitest';
import { parseUrlState, updateUrlState } from './urlState';
describe('shareable state', () => {
  it('sanitizes malformed, out-of-range and nonfinite input', () => {
    const state = parseUrlState(new URLSearchParams('distance=Infinity&helmet=8&vest=-1&timing=nope&scope=16x&pellets=99&click=-4&body=brain'), 500);
    expect(state.distance).toBe(0); expect(state.helmet).toBe(2); expect(state.vest).toBe(2);
    expect(state.scope).toBe('4x'); expect(state.pellets).toBe(9); expect(state.clickIntervalMs).toBe(1); expect(state.body).toBe('chest');
  });
  it('round-trips every user condition', () => {
    const state = { ...parseUrlState(new URLSearchParams(), 500), weapon: 'awm', compare: 'm24', distance: 100, helmet: 3 as const, vest: 1 as const, scope: '8x' as const, timing: 'custom' as const, clickIntervalMs: 321, pellets: 3, archived: true, search: 'a', rpmMode: 'slow' as const, sort: 'ttk' as const };
    expect(parseUrlState(updateUrlState(new URLSearchParams(), state), 500)).toEqual(state);
  });
  it('preserves unrelated state and removes cleared selections', () => {
    const params = updateUrlState(new URLSearchParams('distance=100&compare=akm&archived=1'), { compare: '', archived: false, vest: 3 });
    expect(params.get('distance')).toBe('100'); expect(params.has('compare')).toBe(false); expect(params.has('archived')).toBe(false);
  });
});
