"use client";

import { useMemo, useState } from "react";
import { BikeVisualizer } from "@/components/bike-visualizer";
import type { SizingRequest } from "@/lib/domain/schemas";
import type { SizingDecision, Tenant } from "@/lib/domain/types";

type SizingState =
  | { status: "idle"; decision?: undefined; error?: undefined }
  | { status: "loading"; decision?: SizingDecision; error?: undefined }
  | { status: "success"; decision: SizingDecision; error?: undefined }
  | { status: "error"; decision?: SizingDecision; error: string };

const defaults = {
  heightMm: 1780,
  inseamMm: 835,
  torsoMm: 620,
  armMm: 660,
  shoulderMm: 430,
  weightKg: 78,
  flexibilityScore: 6,
  experienceYears: 4
};

function numberFrom(formData: FormData, key: keyof typeof defaults): number {
  return Number(formData.get(key) ?? defaults[key]);
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="bar">
      <div className="bar-label">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function FitIntake({ tenant, compact = false }: { tenant: Tenant; compact?: boolean }) {
  const [state, setState] = useState<SizingState>({ status: "idle" });
  const bestRecommendation = state.decision?.recommendations[0];
  const cssVars = useMemo(
    () =>
      ({
        "--primary": tenant.theme.primary,
        "--accent": tenant.theme.accent,
        "--surface": tenant.theme.surface,
        "--text": tenant.theme.text
      }) as React.CSSProperties,
    [tenant]
  );

  async function submitSizing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload: SizingRequest = {
      tenantSlug: tenant.slug,
      source: compact ? "embed" : "admin",
      consent: {
        biomechanicsProcessing: true,
        marketingOptIn: formData.get("marketingOptIn") === "on"
      },
      profile: {
        measurements: {
          heightMm: numberFrom(formData, "heightMm"),
          inseamMm: numberFrom(formData, "inseamMm"),
          torsoMm: numberFrom(formData, "torsoMm"),
          armMm: numberFrom(formData, "armMm"),
          shoulderMm: numberFrom(formData, "shoulderMm"),
          weightKg: numberFrom(formData, "weightKg"),
          flexibilityScore: numberFrom(formData, "flexibilityScore")
        },
        intent: String(formData.get("intent") ?? "endurance") as SizingRequest["profile"]["intent"],
        category: String(formData.get("category") ?? "road") as SizingRequest["profile"]["category"],
        experienceYears: numberFrom(formData, "experienceYears"),
        injuryNotes: String(formData.get("injuryNotes") ?? "") || undefined
      }
    };

    setState((current) => ({ status: "loading", decision: current.decision }));

    const response = await fetch("/api/v1/sizing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const body = (await response.json()) as { data?: SizingDecision; error?: { message: string } };
    if (!response.ok || !body.data) {
      setState({
        status: "error",
        decision: state.decision,
        error: body.error?.message ?? "Unable to create sizing recommendation."
      });
      return;
    }

    setState({ status: "success", decision: body.data });
  }

  return (
    <div className="grid two" style={cssVars}>
      <form className="card pad intake" onSubmit={submitSizing}>
        <div>
          <span className="pill">{tenant.displayName} embedded fitting</span>
          <h2>{compact ? "Find your best frame" : "AI sizing intake"}</h2>
          <p>
            Validated rider measurements are processed per tenant and converted into frame, cockpit,
            and handoff recommendations.
          </p>
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="heightMm">Height (mm)</label>
            <input id="heightMm" name="heightMm" type="number" defaultValue={defaults.heightMm} />
          </div>
          <div className="field">
            <label htmlFor="inseamMm">Inseam (mm)</label>
            <input id="inseamMm" name="inseamMm" type="number" defaultValue={defaults.inseamMm} />
          </div>
          <div className="field">
            <label htmlFor="torsoMm">Torso (mm)</label>
            <input id="torsoMm" name="torsoMm" type="number" defaultValue={defaults.torsoMm} />
          </div>
          <div className="field">
            <label htmlFor="armMm">Arm span (mm)</label>
            <input id="armMm" name="armMm" type="number" defaultValue={defaults.armMm} />
          </div>
          <div className="field">
            <label htmlFor="shoulderMm">Shoulder (mm)</label>
            <input id="shoulderMm" name="shoulderMm" type="number" defaultValue={defaults.shoulderMm} />
          </div>
          <div className="field">
            <label htmlFor="weightKg">Weight (kg)</label>
            <input id="weightKg" name="weightKg" type="number" defaultValue={defaults.weightKg} />
          </div>
          <div className="field">
            <label htmlFor="flexibilityScore">Flexibility</label>
            <input
              id="flexibilityScore"
              name="flexibilityScore"
              type="number"
              min="1"
              max="10"
              defaultValue={defaults.flexibilityScore}
            />
          </div>
          <div className="field">
            <label htmlFor="experienceYears">Experience</label>
            <input
              id="experienceYears"
              name="experienceYears"
              type="number"
              defaultValue={defaults.experienceYears}
            />
          </div>
          <div className="field">
            <label htmlFor="intent">Fit intent</label>
            <select id="intent" name="intent" defaultValue="endurance">
              <option value="comfort">Comfort</option>
              <option value="endurance">Endurance</option>
              <option value="performance">Performance</option>
              <option value="race">Race</option>
              <option value="cargo">Cargo</option>
              <option value="commute">Commute</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="category">Bike category</label>
            <select id="category" name="category" defaultValue="road">
              <option value="road">Road</option>
              <option value="gravel">Gravel</option>
              <option value="mountain">Mountain</option>
              <option value="hybrid">Hybrid</option>
              <option value="cargo">Cargo</option>
              <option value="ebike">E-bike</option>
            </select>
          </div>
        </div>

        {!compact ? (
          <div className="field">
            <label htmlFor="injuryNotes">Clinical notes</label>
            <textarea id="injuryNotes" name="injuryNotes" rows={3} placeholder="Optional injury or mobility context" />
          </div>
        ) : null}

        <label className="pill">
          <input name="marketingOptIn" type="checkbox" /> Allow brand follow-up after fit value is shown
        </label>

        {state.status === "error" ? <div className="error">{state.error}</div> : null}

        <button className="button" type="submit" disabled={state.status === "loading"}>
          {state.status === "loading" ? "Sizing..." : "Generate sizing recommendation"}
        </button>
      </form>

      <div className="grid">
        <BikeVisualizer recommendation={bestRecommendation} theme={tenant.theme} />
        <div className="card pad recommendation">
          {bestRecommendation ? (
            <>
              <div className="score">{bestRecommendation.score}</div>
              <div>
                <h2>
                  {bestRecommendation.bikeModelName} / {bestRecommendation.frameLabel}
                </h2>
                <p>{state.decision?.aiSummary}</p>
              </div>
              <div className="grid three">
                <div className="metric">
                  <strong>{bestRecommendation.saddleHeightMm} mm</strong>
                  <span>Saddle height</span>
                </div>
                <div className="metric">
                  <strong>{bestRecommendation.stemLengthMm} mm</strong>
                  <span>Stem</span>
                </div>
                <div className="metric">
                  <strong>{bestRecommendation.handlebarDropMm} mm</strong>
                  <span>Bar drop</span>
                </div>
              </div>
              <div className="breakdown">
                <ScoreBar label="Reach" value={bestRecommendation.scoreBreakdown.reach} />
                <ScoreBar label="Stack" value={bestRecommendation.scoreBreakdown.stack} />
                <ScoreBar label="Standover" value={bestRecommendation.scoreBreakdown.standover} />
                <ScoreBar label="Intent" value={bestRecommendation.scoreBreakdown.intent} />
              </div>
            </>
          ) : (
            <>
              <h2>Recommendation preview</h2>
              <p>
                Submit a rider profile to generate frame size, cockpit setup, confidence scoring,
                and 3D geometry visualization.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
