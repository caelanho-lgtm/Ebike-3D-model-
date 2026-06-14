/**
 * @dtf/geometry — CanonicalBike types, geometry-chart ingest/normalization,
 * and validators. See CLAUDE.md (principle 3) and docs/blueprint.md §1.
 *
 * Everything here is pure and framework-free. Charts (mm/deg) are validated and
 * normalized into BB-anchored SI `CanonicalBike` records; nothing downstream
 * sees vendor formats or display units.
 */

export type {
  Vec2,
  GeometryChart,
  BikePoints,
  CanonicalBike,
  ValidationIssue,
} from './types.js';

export { mmToMetres, metresToMm, degToRad, radToDeg } from './units.js';

export {
  validateGeometryChart,
  assertValidGeometryChart,
  GeometryValidationError,
} from './validate.js';

export { normalizeGeometryChart, slugify } from './normalize.js';

export {
  NORCO_SIGHT_VLT,
  SPECIALIZED_TARMAC_SL7,
  CANYON_GRAIL,
  REAL_BIKE_CHARTS,
} from './fixtures.js';
