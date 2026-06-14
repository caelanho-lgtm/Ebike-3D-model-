import { describe, it, expect } from 'vitest';
import { FIT_CORE_PACKAGE, classify, WINDOWS } from './index.js';

describe('@dtf/fit-core scaffold', () => {
  it('exposes its package marker', () => {
    expect(FIT_CORE_PACKAGE).toBe('@dtf/fit-core');
  });

  it('classifies a value against a quality window deterministically', () => {
    expect(classify('kneeExtension', WINDOWS.kneeExtension.min - 1)).toBe('low');
    expect(classify('kneeExtension', 143)).toBe('ok');
    expect(classify('kneeExtension', WINDOWS.kneeExtension.max + 1)).toBe('high');
  });
});
