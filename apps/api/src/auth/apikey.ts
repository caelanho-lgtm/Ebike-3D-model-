import { createHash, randomBytes } from 'node:crypto';

/**
 * API keys are presented as `fwk_<prefix>_<secret>`. We store only the prefix
 * (for lookup) and a SHA-256 of the full key. The plaintext key is shown to the
 * user exactly once at creation time.
 */
export interface GeneratedApiKey {
  fullKey: string;
  prefix: string;
  keyHash: string;
}

export function generateApiKey(): GeneratedApiKey {
  const prefix = randomBytes(6).toString('hex'); // 12 chars
  const secret = randomBytes(24).toString('hex'); // 48 chars
  const fullKey = `fwk_${prefix}_${secret}`;
  return { fullKey, prefix, keyHash: hashApiKey(fullKey) };
}

export function hashApiKey(fullKey: string): string {
  return createHash('sha256').update(fullKey).digest('hex');
}

/** Extract the lookup prefix from a presented key, or null if malformed. */
export function parseApiKeyPrefix(fullKey: string): string | null {
  const match = /^fwk_([0-9a-f]{12})_[0-9a-f]{48}$/.exec(fullKey);
  return match ? match[1] : null;
}
