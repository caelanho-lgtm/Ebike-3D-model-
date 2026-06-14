import { describe, it, expect } from 'vitest';
import { GEOMETRY_PACKAGE } from './index.js';

describe('@dtf/geometry scaffold', () => {
  it('exposes its package marker', () => {
    expect(GEOMETRY_PACKAGE).toBe('@dtf/geometry');
  });
});
