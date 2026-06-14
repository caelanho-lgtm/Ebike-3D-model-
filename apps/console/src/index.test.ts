import { describe, it, expect } from 'vitest';
import { CONSOLE_APP } from './index.js';

describe('@dtf/console scaffold', () => {
  it('exposes its app marker', () => {
    expect(CONSOLE_APP).toBe('@dtf/console');
  });
});
