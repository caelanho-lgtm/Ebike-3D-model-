import { useMemo, useState, type ReactElement } from "react";
import { BikeScene } from "./components/BikeScene";
import { requestRecommendation, type Recommendation } from "./api";

const searchParams = new URLSearchParams(window.location.search);
const theme = searchParams.get("theme") === "dark" ? "dark" : "light";

const defaultRider = {
  bikeModelId: import.meta.env.VITE_DEFAULT_BIKE_MODEL_ID ?? "",
  riderProfile: {
    inseamCm: 82,
    torsoCm: 60,
    armCm: 63,
    heightCm: 178,
    flexibilityScore: 6,
    discipline: "road" as const
  }
};

export default function App(): ReactElement {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [bikeModelId, setBikeModelId] = useState(searchParams.get("bikeModelId") ?? defaultRider.bikeModelId);

  const payload = useMemo(
    () => ({
      ...defaultRider,
      bikeModelId
    }),
    [bikeModelId]
  );

  const onPredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await requestRecommendation(payload);
      setRecommendation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown sizing error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "1rem",
        color: theme === "dark" ? "#f9fafb" : "#111827",
        backgroundColor: theme === "dark" ? "#111827" : "#ffffff"
      }}
    >
      <h1 style={{ marginBottom: "0.25rem" }}>BikeFit 3D Sizing Widget</h1>
      <p style={{ marginTop: 0, color: theme === "dark" ? "#cbd5e1" : "#4b5563" }}>
        Embeddable fit experience for bike brands and retailers.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          alignItems: "stretch"
        }}
      >
        <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, minHeight: 380 }}>
          <BikeScene />
        </section>

        <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "1rem" }}>
          <label htmlFor="bikeModelId">Bike Model ID</label>
          <input
            id="bikeModelId"
            value={bikeModelId}
            onChange={(event) => setBikeModelId(event.target.value)}
            placeholder="Enter bike model id"
            style={{ display: "block", width: "100%", marginTop: "0.4rem", marginBottom: "0.8rem", padding: "0.5rem" }}
          />
          <button onClick={() => void onPredict()} disabled={loading || bikeModelId.length === 0}>
            {loading ? "Calculating..." : "Generate Recommendation"}
          </button>

          {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

          {recommendation ? (
            <article style={{ marginTop: "1rem", background: "#f9fafb", padding: "0.75rem", borderRadius: 8 }}>
              <h2 style={{ margin: 0 }}>Recommended frame: {recommendation.recommendedFrame}</h2>
              <p>Confidence: {recommendation.confidence}%</p>
              <ul>
                {recommendation.rankedOptions.map((option) => (
                  <li key={option.frameLabel}>
                    {option.frameLabel}: {option.fitScore.toFixed(2)}
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
        </section>
      </div>
    </main>
  );
}
