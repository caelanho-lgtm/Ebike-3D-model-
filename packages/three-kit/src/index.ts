/**
 * @dtf/three-kit — R3F components driven by FitState: HologramRider, BikeModel,
 * grab-and-drag gizmos, holographic shader. See docs/blueprint.md §2 and the
 * reference implementation in docs/prototype.html.
 *
 * NON-NEGOTIABLE (CLAUDE.md): components render `FitState`; they hold no fit
 * math. SCAFFOLD: React/R3F deps + components are added in the 3D-kit slice.
 */

export const THREE_KIT_PACKAGE = '@dtf/three-kit' as const;
