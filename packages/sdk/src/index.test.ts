import { describe, it, expect } from 'vitest';
import { SDK_PACKAGE } from './index.js';

describe('@dtf/sdk scaffold', () => {
  it('exposes its package marker', () => {
    expect(SDK_PACKAGE).toBe('@dtf/sdk');
  });
});
