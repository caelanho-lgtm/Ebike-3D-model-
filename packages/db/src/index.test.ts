import { describe, it, expect } from 'vitest';
import { DB_PACKAGE } from './index.js';

describe('@dtf/db scaffold', () => {
  it('exposes its package marker', () => {
    expect(DB_PACKAGE).toBe('@dtf/db');
  });
});
