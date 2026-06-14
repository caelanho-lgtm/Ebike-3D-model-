import { describe, it, expect } from 'vitest';
import { UI_PACKAGE } from './index.js';

describe('@dtf/ui scaffold', () => {
  it('exposes its package marker', () => {
    expect(UI_PACKAGE).toBe('@dtf/ui');
  });
});
