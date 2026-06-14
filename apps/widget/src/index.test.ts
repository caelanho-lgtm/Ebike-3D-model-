import { describe, it, expect } from 'vitest';
import { WIDGET_APP } from './index.js';

describe('@dtf/widget scaffold', () => {
  it('exposes its app marker', () => {
    expect(WIDGET_APP).toBe('@dtf/widget');
  });
});
