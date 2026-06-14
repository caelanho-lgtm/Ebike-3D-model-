import { describe, it, expect } from 'vitest';
import { API_APP } from './index.js';

describe('@dtf/api scaffold', () => {
  it('exposes its app marker', () => {
    expect(API_APP).toBe('@dtf/api');
  });
});
