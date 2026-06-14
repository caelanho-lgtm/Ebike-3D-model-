import { describe, it, expect } from 'vitest';
import { THREE_KIT_PACKAGE } from './index.js';

describe('@dtf/three-kit scaffold', () => {
  it('exposes its package marker', () => {
    expect(THREE_KIT_PACKAGE).toBe('@dtf/three-kit');
  });
});
