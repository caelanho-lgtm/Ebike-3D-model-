import {
  calculateFit,
  type FitParameters,
  type FitResult,
  type RiderAnthropometrics,
} from '@/lib/fitEngine/calculateFit';
import { prisma } from '../db';

export interface ComputeFitInput {
  rider: RiderAnthropometrics;
  params: FitParameters;
  bikeId?: string;
  riderId?: string;
  size?: string;
  /** Persist the result as a FitSession. */
  persist?: boolean;
}

/**
 * Compute a fit. This is a pure, DB-free calculation; persistence is optional
 * and best-effort so the endpoint works with or without a database.
 */
export async function computeFit(
  tenantId: string,
  input: ComputeFitInput,
): Promise<{ fit: FitResult; sessionId?: string }> {
  const fit = calculateFit(input.rider, input.params);

  if (!input.persist) return { fit };

  try {
    const session = await prisma.fitSession.create({
      data: {
        tenantId,
        riderId: input.riderId ?? null,
        bikeId: input.bikeId ?? null,
        size: input.size ?? 'M',
        paramsJson: JSON.stringify(input.params),
        resultJson: JSON.stringify(fit),
        fitScore: fit.fitScore,
      },
    });
    return { fit, sessionId: session.id };
  } catch {
    return { fit };
  }
}
